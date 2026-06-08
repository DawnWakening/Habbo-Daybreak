package com.eu.habbo.habbohotel.catalog;

public enum CatalogPageMode {
    NORMAL("NORMAL"),
    BUILDERS_CLUB("BUILDERS_CLUB");

    private final String clientMode;

    CatalogPageMode(String clientMode) {
        this.clientMode = clientMode;
    }

    public String getClientMode() {
        return this.clientMode;
    }

    public boolean isBuildersClub() {
        return this == BUILDERS_CLUB;
    }

    public static CatalogPageMode fromClientMode(String clientMode) {
        if (clientMode == null) {
            return NORMAL;
        }

        for (CatalogPageMode value : values()) {
            if (value.clientMode.equalsIgnoreCase(clientMode)) {
                return value;
            }
        }

        return NORMAL;
    }
}
