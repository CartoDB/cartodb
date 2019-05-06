<template>
  <section class="welcome-basic">
    <div class="container">
      <div class="welcome-basic__greeting title is-title">{{ greeting }}</div>
      <span v-if="hasNotifications" class="notification-led"></span>
      <div class="welcome-basic__text text is-caption">{{ text }}</div>
      <div class="welcome-basic__actions">
        <button v-if="!hasNotifications" class="button button--small is-primary">Learn More</button>
        <button v-if="hasNotifications" class="button button--small is-primary">Go to Notifications</button>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'WelcomeBasic',
  props: {
    username: String,
    notifications: Array
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {username: this.$props.username});
    },
    text () {
      return this.hasNotifications
        ? 'You have unread notifications, do you want to read them now?'
        : 'We just released CARTO VL, our new vector rendering Javascript library to create amazing LI applications.';
    },
    hasNotifications () {
      return this.$props.notifications.length > 0;
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.welcome-basic {
  position: relative;
  padding: 124px 0;
  text-align: center;

  .notification-led {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $notification__bg-color;
    vertical-align: top;
  }

  &__greeting {
    display: inline-block;
  }

  &__text {
    max-width: 724px;
    margin: 16px auto 48px;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }
}
</style>
