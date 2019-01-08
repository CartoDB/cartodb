<template>
  <section class="section section--noBorder">
    <div class="container warning-container">
      <div class="warning-icon">
        <img src="../../assets/icons/expired-trial/warning-icon.svg" />
      </div>
      <h2 class="warning-title title is-title is-txtDarkBlue">
        Your trial has expired
      </h2>
      <p class="warning-description text is-body is-txtDarkBlue">
        We couldn’t log you in because your trial expired on {{ humanReadableExpirationDate }}.<br/>
        All of your data will be safe for the next {{ expirationDays }} days, but no one will be able to log in until your account is upgraded.
        Please, take a look to our <a href="#">pricing plans</a>.
      </p>
      <div class="buttons-container">
        <a href="#" class="button is-bgDarkBlue button--large upgrade-button">
          <span>Upgrade your account</span>
        </a>
        <a href="#" class="buttonLink no-transform button--large is-txtDarkBlue">
          <span>Contact Sales</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script>
import format from 'date-fns/format';

export default {
  name: 'ExpirationMessage',
  data () {
    return {
      expirationDays: window.expiration_days
    };
  },
  computed: {
    humanReadableExpirationDate () {
      return format(this.$store.state.user.trial_ends_at, 'MMMM DD, YYYY');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.upgrade-button {
  margin-right: 64px;
}

.warning-container {
  text-align: center;
}

.warning-icon {
  margin-bottom: 48px;
}

.warning-title {
  margin-bottom: 16px;
  color: $text-color-dark;
}

.warning-description {
  margin-bottom: 16px;
  color: $text-color-dark;
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36px;
}
</style>
