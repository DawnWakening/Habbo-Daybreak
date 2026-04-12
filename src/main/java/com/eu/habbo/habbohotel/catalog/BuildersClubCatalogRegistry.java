package com.eu.habbo.habbohotel.catalog;

import com.eu.habbo.habbohotel.items.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class BuildersClubCatalogRegistry {
    private static final Logger LOGGER = LoggerFactory.getLogger(BuildersClubCatalogRegistry.class);

    private final Set<Integer> compatibleOfferIds;
    private final Set<Integer> compatibleBaseItemIds;
    private final Set<String> compatiblePairs;

    public BuildersClubCatalogRegistry() {
        this(Collections.emptySet(), Collections.emptySet(), Collections.emptySet());
    }

    private BuildersClubCatalogRegistry(Set<Integer> compatibleOfferIds, Set<Integer> compatibleBaseItemIds, Set<String> compatiblePairs) {
        this.compatibleOfferIds = compatibleOfferIds;
        this.compatibleBaseItemIds = compatibleBaseItemIds;
        this.compatiblePairs = compatiblePairs;
    }

    public static BuildersClubCatalogRegistry load(String url) {
        if (url == null || url.isBlank()) {
            return new BuildersClubCatalogRegistry();
        }

        try (InputStream stream = new URL(url).openStream()) {
            return parse(stream);
        } catch (Exception e) {
            LOGGER.error("Failed to load Builder's Club furnidata from {}", url, e);
            return new BuildersClubCatalogRegistry();
        }
    }

    static BuildersClubCatalogRegistry parse(InputStream stream) throws Exception {
        Document document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(stream);
        document.getDocumentElement().normalize();

        Set<Integer> offerIds = new HashSet<>();
        Set<Integer> baseItemIds = new HashSet<>();
        Set<String> pairs = new HashSet<>();

        parseEntries(document.getElementsByTagName("furnitype"), offerIds, baseItemIds, pairs);
        parseEntries(document.getElementsByTagName("wallitemtype"), offerIds, baseItemIds, pairs);

        return new BuildersClubCatalogRegistry(
                Collections.unmodifiableSet(offerIds),
                Collections.unmodifiableSet(baseItemIds),
                Collections.unmodifiableSet(pairs)
        );
    }

    private static void parseEntries(NodeList nodes, Set<Integer> offerIds, Set<Integer> baseItemIds, Set<String> pairs) {
        for (int i = 0; i < nodes.getLength(); i++) {
            Node node = nodes.item(i);
            if (!(node instanceof Element element)) {
                continue;
            }

            int baseItemId = parseInt(element.getAttribute("id"));
            int offerId = parseInt(childText(element, "offerid"));
            boolean buildersClub = "1".equals(childText(element, "bc"));

            if (!buildersClub || baseItemId <= 0 || offerId <= 0) {
                continue;
            }

            offerIds.add(offerId);
            baseItemIds.add(baseItemId);
            pairs.add(pairKey(baseItemId, offerId));
        }
    }

    private static String childText(Element element, String name) {
        NodeList nodes = element.getElementsByTagName(name);
        if (nodes.getLength() == 0 || nodes.item(0) == null) {
            return "";
        }

        return nodes.item(0).getTextContent().trim();
    }

    private static int parseInt(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return -1;
        }
    }

    private static String pairKey(int baseItemId, int offerId) {
        return baseItemId + ":" + offerId;
    }

    public boolean isCompatible(int baseItemId, int offerId) {
        return baseItemId > 0
                && offerId > 0
                && this.compatiblePairs.contains(pairKey(baseItemId, offerId));
    }

    public boolean hasCompatibleOffer(int offerId) {
        return this.compatibleOfferIds.contains(offerId);
    }

    public boolean hasCompatibleBaseItem(int baseItemId) {
        return this.compatibleBaseItemIds.contains(baseItemId);
    }

    public boolean matches(CatalogItem item) {
        if (item == null || item.getOfferId() <= 0) {
            return false;
        }

        for (Item baseItem : item.getBaseItems()) {
            if (baseItem != null && isCompatible(baseItem.getId(), item.getOfferId())) {
                return true;
            }
        }

        return false;
    }

    public int size() {
        return this.compatiblePairs.size();
    }
}
