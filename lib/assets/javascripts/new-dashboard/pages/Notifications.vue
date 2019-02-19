<template>
  <section class="page">
    <div class="notifications-list-container container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title="pageTitle" :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/envelope.svg">
          </template>
        </SectionTitle>
        <ul v-if="!emptyState" class="notifications-list grid-cell  grid-cell--col9 grid-cell--col12--tablet">
          <li class="notification-item" v-for="notification in notifications" :key="notification.id">
            <NotificationCard
              :receivedAt="notification.received_at"
              :readAt="notification.read_at"
              :htmlBody="notification.html_body">
            </NotificationCard>
          </li>
        </ul>
        <EmptyState v-if="!isFetching && emptyState" :text="emptyStateText">
          <img svg-inline src="../assets/icons/common/check-bubble.svg">
        </EmptyState>
        <LoadingState v-if="isFetching" :text="loadingStateText" class="loading-state"></LoadingState>
      </div>
    </div>
  </section>
</template>

<script>
import EmptyState from '../components/States/EmptyState';
import LoadingState from '../components/States/LoadingState';
import NotificationCard from '../components/NotificationCard';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'NotificationsPage',
  components: {
    EmptyState,
    LoadingState,
    NotificationCard,
    SectionTitle
  },
  computed: {
    pageTitle () {
      return this.$t(`NotificationsPage.header.title`);
    },
    notifications () {
      return this.$store.state.notifications.notifications;
    },
    emptyState () {
      return !this.notifications || !this.notifications.length;
    },
    emptyStateText () {
      return this.$t(`NotificationsPage.emptyState`);
    },
    loadingStateText () {
      return this.$t(`NotificationsPage.loadingState`);
    },
    isFetching () {
      return this.$store.state.notifications.isFetching;
    }
  },
  mounted: function() {
    this.$store.dispatch('user/resetOrganizationNotifications');
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

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

.empty-state,
.loading-state {
  margin: 20vh 0 8vh;
}
</style>
