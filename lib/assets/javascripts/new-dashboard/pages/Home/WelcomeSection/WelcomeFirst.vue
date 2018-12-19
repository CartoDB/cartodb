<template>
  <section class="welcome-first">
    <div class="container">
      <div class="welcome-first__greeting title is-title">{{ greeting }}</div>
      <div class="welcome-first__text text is-caption">{{ text }}</div>
      <div class="welcome-first__actions">
        <CreateButton visualizationType="map">{{ $t(`MapsPage.createMap`) }}</CreateButton>
        <CreateButton visualizationType="map">{{ $t(`DataPage.createDataset`) }}</CreateButton>
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'WelcomeFirst',
  components: {
    CreateButton
  },
  props: {
    username: String
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {username: this.$props.username});
    },
    text () {
      return 'You have an [account plan] and you are a of [organization name]. Want to know more about your new dashboard?';
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.welcome-first {
  position: relative;
  padding: 124px 0;
  background: $primary-color;
  color: $white;
  text-align: center;

  &__text {
    max-width: 724px;
    margin: 16px auto 48px;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }

  .button {
    border: 1px solid $white;
    background: none;
    color: $white;
    text-transform: uppercase;

    &:first-child {
      margin-right: 36px;
    }
  }
}
</style>
