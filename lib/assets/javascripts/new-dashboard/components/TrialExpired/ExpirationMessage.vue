<template>
  <section class="section section--noBorder">
    <div class="container warning-container">
      <div class="warning-icon">
        <img svg-inline src="../../assets/icons/expired-trial/warning-icon.svg">
      </div>
      <h2 class="warning-title title is-title is-txtDarkBlue">Your trial has expired</h2>
      <p class="warning-description text is-body is-txtDarkBlue">We couldn’t log you in because your trial expired on September 10, 2018.<br/> All of your data is safe, but no one will be able to log in until you account is upgraded.</p>
      <div class="buttons-container">
        <a href="#" class="button is-bgDarkBlue button--large upgrade-button">
          <span>Upgrade your account</span>
        </a>
        <a href="#" class="buttonLink no-transform button--large is-txtDarkBlue">
          <span>What happens now?</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ExpirationMessage',
  components: {
  },
  computed: {
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
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36px;
}
</style>
