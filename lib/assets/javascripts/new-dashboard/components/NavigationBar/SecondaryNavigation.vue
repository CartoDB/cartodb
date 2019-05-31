<template>
  <section class="secondary-navigation">
    <div class="container secondary-navigation__content">
      <div class="secondary-navigation__greeting title is-caption">{{ $props.leftText }}</div>
      <div class="secondary-navigation__actions">
        <slot name="buttons"/>
      </div>

      <div class="secondary-navigation__extra">
        <slot name="trialEndDate"/>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'SecondaryNavigation',
  props: {
    leftText: String
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.secondary-navigation {
  position: relative;
  padding: 20px;
  border-bottom: 1px solid #E6E8EB;

  &__content {
    display: flex;
    align-items: center;
    max-width: 940px;
    padding: 0;
  }

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
}
</style>
