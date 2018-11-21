<template>
  <section class="page">
    <div class="notifications-list-container container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/envelope.svg">
          </template>
        </SectionTitle>
        <section class="notifications-list--empty">
          <h3 class="text is-caption ">There are no notifications yet</h3>
        </section>
        <section class="notifications-list" v-if="notifications" >
          <NotificationCard 
          v-for="notification in notifications"
          :key="notification.id"
          :receivedAt='notification.received_at'
          :readAt='notification.read_at'
          :htmlBody='notification.html_body'>
        </NotificationCard>
        </section>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from "../components/SectionTitle";
import NotificationCard from "../components/NotificationCard";
export default {
  name: "NotificationsPage",
  components: {
    SectionTitle,
    NotificationCard
  },
  props: {},
  computed: {
    pageTitle() {
      return this.$t(`NotificationsPage.header.title`);
    },
    notifications() {
      return null;
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
          read_at: null,
          received_at: "2018-11-19T17:11:42.285Z"
        }
      ];
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.notifications-list-container {
  margin-bottom: 44px;
}

.notifications-list--empty {
  color: $text-secondary-color;
  text-align: center;
}

.full-width {
  width: 100%;
}
</style>
