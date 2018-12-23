<template>
  <section class="welcome-compact">
    <div class="container welcome-compact__content">
      <div class="welcome-compact__greeting title is-caption">{{ greeting }}</div>
      <div class="welcome-compact__actions">
        <CreateButton class="button--ghost" visualizationType="map">{{ $t(`HomePage.WelcomeSection.actions.createMap`) }}</CreateButton>
        <CreateButton class="button--ghost" visualizationType="map">{{ $t(`HomePage.WelcomeSection.actions.createDataset`) }}</CreateButton>
      </div>

      <div class="welcome-compact__extra">
        <slot />
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'WelcomeCompact',
  components: {
    CreateButton
  },
  props: {
    username: String
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {username: this.$props.username});
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.welcome-compact__content {
  display: flex;
  align-items: center;
  max-width: 940px;
  padding: 0;
}

.welcome-compact {
  position: relative;
  padding: 20px;
  border-bottom: 1px solid #E6E8EB;

  &__greeting {
    display: inline-block;
    margin-right: 64px;
  }

  &__actions {
    display: inline-flex;
  }

  &__extra {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .button--ghost {
    margin-right: 36px;
    padding: 0;
    background: none;
    color: #047AE6;
    text-transform: none;
  }

  .button--outline {
    margin-left: 24px;
    padding: 9px 16px;
  }
}
</style>
