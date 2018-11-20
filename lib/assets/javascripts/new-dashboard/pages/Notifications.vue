<template>
  <section class="page">
    <div class="notifications-list-container container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/envelope.svg">
          </template>
        </SectionTitle>
        {{notifications}}
        <NotificationCard>
        </NotificationCard>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from '../components/SectionTitle';
import NotificationCard from '../components/NotificationCard';
export default {
  name: 'NotificationsPage',
  components: {
    SectionTitle,
    NotificationCard
  },
  props: {},
  computed: {
    pageTitle () {
      return this.$t(`NotificationsPage.header.title`);
    },
    notifications () {
      return this.$store.state.user.organizationNotifications;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.notifications-list-container {
  margin-bottom: 44px;
}
</style>
