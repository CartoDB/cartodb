<template>
  <li class="apps__item">
    <div class="apps__icon">
      <img :src="oAuthApp.icon_url || require('../../assets/icons/apps/default.svg')">
    </div>

    <div class="apps__item-info">
      <span class="text is-small is-semibold apps__item-title">{{ oAuthApp.name }}</span>
      <span class="text is-small apps__item-description">{{ oAuthApp.description || 'No description provided' }}</span>
    </div>

    <slot />
  </li>
</template>

<script>

export default {
  name: 'AppElement',
  props: {
    oAuthApp: Object
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.apps {
  &__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 28px 0;
    border-bottom: 1px solid $neutral--300;
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 0 20px;
  }

  &__item-title,
  &__item-description {
    word-break: break-all;
  }

  &__item-title {
    line-height: 22px;
  }

  &__item-description {
    color: $neutral--600;
  }

  &__icon {
    display: flex;
    position: relative;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    overflow: hidden;
    border: 1px solid $neutral--300;
    border-radius: 2px;

    img {
      max-width: 100%;
      max-height: 100%;
    }
  }
}
</style>
