<template>
  <section class="page">
    <div class="notifications-list-container container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/envelope.svg">
          </template>
        </SectionTitle>

        <div class="grid" v-if="hasNotifications">
          <ul class="notifications-list grid-cell  grid-cell--col9 grid-cell--col12--tablet">
            <li class="notification-item" v-for="notification in notifications" :key="notification.id">
              <NotificationCard
                :receivedAt='notification.received_at'
                :readAt='notification.read_at'
                :htmlBody='notification.html_body'>
              </NotificationCard>
            </li>
          </ul>
        </div>

        <EmptyState v-if="!hasNotifications" :text="emptyStateText">
          <img svg-inline src="../assets/icons/maps/compass.svg">
        </EmptyState>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from "../components/SectionTitle";
import EmptyState from "../components/States/EmptyState";
import NotificationCard from "../components/NotificationCard";
export default {
  name: "NotificationsPage",
  components: {
    SectionTitle,
    EmptyState,
    NotificationCard
  },
  props: {},
  computed: {
    pageTitle() {
      return this.$t(`NotificationsPage.header.title`);
    },
    notifications() {
      return [
        {
          html_body:
            "<p>Cupcake Ipsum dolor gingerbread chocolate. <em>Pudding</em> wafer ice cream. Powder ice cream carrot cake <strong>liquorice</strong> cookie oat cake.</p>",
          icon: "alert",
          id: "288dfe6e-1a9d-4157-bd36-41cd8459af62",
          read_at: null,
          received_at: "2018-11-20T15:28:21.792Z"
        },
        {
          html_body: "<p>Holi parte 2</p>",
          icon: "alert",
          id: "091a04a7-28d6-4fcf-bd8a-b1c34842bdb4",
          read_at: "2018-11-20T17:11:42.285Z",
          received_at: "2018-11-19T17:11:42.285Z"
        }
      ];
      return this.$store.state.user.organizationNotifications;
    },
    hasNotifications() {
      return this.notifications || this.notifications.length > 0;
    },
    emptyStateText() {
      return $t("NotificationsPage.emptyState");
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.notifications-list-container {
  margin-bottom: 44px;
}

.full-width {
  width: 100%;
}

.notification-item {
  margin-bottom: 36px;
  border-bottom: 1px solid $softblue;

  &:last-child {
    border-bottom: none;
  }

  .notification {
    margin-bottom: 36px;
  }
}
</style>
