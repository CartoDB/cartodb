<template>
  <section class="welcome-first">
    <div class="container">
      <div class="welcome-first__greeting title is-caption">{{ greeting }}</div>
      <div class="welcome-first__actions">
        <CreateButton visualizationType="map">{{ $t(`MapsPage.createMap`) }}</CreateButton>
        <CreateButton visualizationType="map">{{ $t(`DataPage.createDataset`) }}</CreateButton>
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from "new-dashboard/components/CreateButton.vue";

export default {
  name: "WelcomeFirst",
  components: {
    CreateButton
  },
  props: {
    username: String
  },
  computed: {
    greeting() {
      return `Hello, ${this.$props.username}`;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.welcome-first {
  position: relative;
  top: 64px;
  padding: 24px;
  border-bottom: 1px solid #E6E8EB;

  &__greeting {
    display: inline-block;
    margin-right: 64px;
  }

  &__actions {
    display: inline-flex;
  }

  .button {
    margin-right: 36px;
    padding: 0;
    background: none;
    color: #047AE6;
    text-transform: uppercase;
  }
}
</style>
