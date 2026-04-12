package com.eu.habbo.habbohotel.users.subscriptions;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.achievements.Achievement;
import com.eu.habbo.habbohotel.achievements.AchievementManager;
import com.eu.habbo.habbohotel.permissions.Permission;
import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.habbohotel.users.HabboInfo;
import com.eu.habbo.habbohotel.users.HabboStats;
import com.eu.habbo.messages.outgoing.catalog.BuildersClubFurniCountMessageComposer;
import com.eu.habbo.messages.outgoing.generic.alerts.BubbleAlertKeys;
import com.eu.habbo.messages.outgoing.generic.alerts.NotificationDialogMessageComposer;
import com.eu.habbo.messages.outgoing.unknown.BuildersClubSubscriptionStatusMessageComposer;
import com.eu.habbo.messages.outgoing.users.PerkAllowancesMessageComposer;
import gnu.trove.map.hash.THashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class SubscriptionBuildersClub extends Subscription {
    private static final Logger LOGGER = LoggerFactory.getLogger(SubscriptionBuildersClub.class);

    public static final int BUILDERS_CLUB_ITEM_ID_START = 0x7FFF0000;

    public static boolean ENABLED = false;
    public static int FURNI_LIMIT = 75;
    public static int MAX_FURNI_LIMIT = 250;
    public static int BOX_FURNI_LIMIT_INCREMENT = 750;
    public static int GRACE_SECONDS = 0;
    public static boolean GROUP_ROOM_PLACEMENT_ENABLED = false;
    public static String EXPIRY_ACTION = "none";
    public static String ACHIEVEMENT_NAME = "BuildersClub";
    public static String BUY_MEMBERSHIP_PAGE = "";
    public static String TRY_PAGE = "";

    public SubscriptionBuildersClub(Integer id, Integer userId, String subscriptionType, Integer timestampStart, Integer duration, Boolean active) {
        super(id, userId, subscriptionType, timestampStart, duration, active);
    }

    @Override
    public void onCreated() {
        super.onCreated();
        Habbo habbo = Emulator.getGameEnvironment().getHabboManager().getHabbo(this.getUserId());
        progressAchievement(this.getUserId());

        if (habbo != null && habbo.getClient() != null) {
            habbo.getClient().sendResponse(new NotificationDialogMessageComposer(hasPreviousBuildersClubSubscription(habbo.getHabboStats())
                    ? BubbleAlertKeys.BUILDERS_CLUB_MEMBERSHIP_RENEWED.key
                    : BubbleAlertKeys.BUILDERS_CLUB_MEMBERSHIP_MADE.key));
            pushCatalogState(habbo);
            sendRoomLockStateBubble(habbo);
        }
    }

    @Override
    public void onExtended(int duration) {
        super.onExtended(duration);
        Habbo habbo = Emulator.getGameEnvironment().getHabboManager().getHabbo(this.getUserId());
        progressAchievement(this.getUserId());

        if (habbo != null && habbo.getClient() != null) {
            habbo.getClient().sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.BUILDERS_CLUB_MEMBERSHIP_EXTENDED.key));
            pushCatalogState(habbo);
            sendRoomLockStateBubble(habbo);
        }
    }

    @Override
    public void onExpired() {
        super.onExpired();

        Habbo habbo = Emulator.getGameEnvironment().getHabboManager().getHabbo(this.getUserId());
        if (habbo != null && habbo.getClient() != null) {
            habbo.getClient().sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.BUILDERS_CLUB_MEMBERSHIP_EXPIRED.key));
        }

        applyExpiryAction(this.getUserId());

        if (habbo != null && habbo.getClient() != null) {
            pushCatalogState(habbo);
            sendRoomLockStateBubble(habbo);
        }
    }

    public static boolean isEnabled() {
        return ENABLED;
    }

    public static boolean isBuildersClubItemId(int itemId) {
        return itemId >= BUILDERS_CLUB_ITEM_ID_START;
    }

    public static boolean hasVisitorsBlockingPlacement(Room room, Habbo owner) {
        for (Habbo habbo : room.getHabbos()) {
            if (habbo == null || habbo == owner) {
                continue;
            }

            if (!habbo.hasPermission(Permission.ACC_MODTOOL_ROOM_INFO)) {
                return true;
            }
        }

        return false;
    }

    public static boolean shouldLockRoom(Room room) {
        if (!"lock".equalsIgnoreCase(EXPIRY_ACTION) || room == null || !room.hasBuildersClubItems()) {
            return false;
        }

        HabboInfo owner = Emulator.getGameEnvironment().getHabboManager().getHabboInfo(room.getOwnerId());
        return owner != null && owner.getHabboStats().getBuildersClubSecondsRemaining() <= 0;
    }

    public static void pushCatalogState(Habbo habbo) {
        if (habbo == null || habbo.getClient() == null) {
            return;
        }

        habbo.getHabboStats().invalidateBuildersClubFurniCount();
        habbo.getClient().sendResponse(new BuildersClubSubscriptionStatusMessageComposer(habbo));
        habbo.getClient().sendResponse(new BuildersClubFurniCountMessageComposer(habbo));
        habbo.getClient().sendResponse(new PerkAllowancesMessageComposer(habbo));
    }

    public static void notifyBuildersClubVisitorDenied(Room room, Habbo guest) {
        if (guest != null && guest.getClient() != null) {
            guest.getClient().sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.BUILDERS_CLUB_VISIT_DENIED_GUEST.key));
        }

        Habbo owner = Emulator.getGameEnvironment().getHabboManager().getHabbo(room.getOwnerId());
        if (owner != null && owner.getClient() != null) {
            owner.getClient().sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.BUILDERS_CLUB_VISIT_DENIED_OWNER.key));
        }
    }

    public static void sendRoomLockStateBubble(Habbo habbo) {
        if (habbo == null || habbo.getClient() == null) {
            return;
        }

        if (habbo.getHabboStats().getBuildersClubFurniCount() <= 0) {
            return;
        }

        habbo.getClient().sendResponse(new NotificationDialogMessageComposer(
                habbo.getHabboStats().getBuildersClubSecondsRemaining() > 0
                        ? BubbleAlertKeys.BUILDERS_CLUB_ROOM_UNLOCKED.key
                        : BubbleAlertKeys.BUILDERS_CLUB_ROOM_LOCKED.key
        ));
    }

    public static void applyExpiryAction(int userId) {
        if ("pickup".equalsIgnoreCase(EXPIRY_ACTION)) {
            for (Room room : Emulator.getGameEnvironment().getRoomManager().getActiveRooms()) {
                room.pickUpBuildersClubItems(userId, null);
            }

            try (Connection connection = Emulator.getDatabase().getDataSource().getConnection();
                 PreparedStatement statement = connection.prepareStatement("DELETE FROM items WHERE user_id = ? AND id >= ?")) {
                statement.setInt(1, userId);
                statement.setInt(2, BUILDERS_CLUB_ITEM_ID_START);
                statement.executeUpdate();
            } catch (SQLException e) {
                LOGGER.error("Failed to clean up Builder's Club items for user {}", userId, e);
            }
        }

        Habbo habbo = Emulator.getGameEnvironment().getHabboManager().getHabbo(userId);
        if (habbo != null) {
            habbo.getHabboStats().invalidateBuildersClubFurniCount();
        }
    }

    private static boolean hasPreviousBuildersClubSubscription(HabboStats stats) {
        int count = 0;
        for (Subscription subscription : stats.subscriptions) {
            if (Subscription.BUILDERS_CLUB.equalsIgnoreCase(subscription.getSubscriptionType())) {
                count++;
                if (count > 1) {
                    return true;
                }
            }
        }

        return false;
    }

    private static void progressAchievement(int userId) {
        HabboInfo habboInfo = Emulator.getGameEnvironment().getHabboManager().getHabboInfo(userId);
        if (habboInfo == null) {
            return;
        }

        Achievement achievement = Emulator.getGameEnvironment().getAchievementManager().getAchievement(ACHIEVEMENT_NAME);
        if (achievement == null) {
            return;
        }

        int currentProgress = habboInfo.getHabboStats().getAchievementProgress(achievement);
        if (currentProgress == -1) {
            currentProgress = 0;
        }

        int progressToSet = (int) Math.ceil(habboInfo.getHabboStats().getPastTimeAsBuildersClub() / 2678400.0);
        int toIncrease = Math.max(progressToSet - currentProgress, 0);

        if (toIncrease > 0) {
            AchievementManager.progressAchievement(userId, achievement, toIncrease);
        }
    }
}
