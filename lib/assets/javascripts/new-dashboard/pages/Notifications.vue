<template>
  <section class="page">
    <div class="notifications-list-container container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/envelope.svg">
          </template>
        </SectionTitle>

        <div class="grid" v-if="!emptyState">
          <ul class="notifications-list grid-cell  grid-cell--col9 grid-cell--col12--tablet">
            <li class="notification-item">
              <NotificationCard
                v-for="notification in notifications"
                :key="notification.id"
                :receivedAt='notification.received_at'
                :readAt='notification.read_at'
                :htmlBody='notification.html_body'>
              </NotificationCard>
            </li>
          </ul>
        </div>

        <EmptyState
          v-if="emptyState"
          :text="emptyStateText"
          >
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
      return this.$store.state.user.organizationNotifications;
    },
    emptyState() {
      return !this.notifications || !this.notifications.length;
    },
    emptyStateText() {
      return $t('NotificationsPage.emptyState');
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
  border-bottom: 1px solid $softblue;

  &:last-child {
    border-bottom: none;
  }
}
</style>
