<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <slot />
    </div>

    <h6 v-html="text" class="empty-state__text empty-state__title text is-caption is-txtSoftGrey"></h6>
    <p v-html="subtitle" v-if="subtitle" class="empty-state__text text is-caption is-txtSoftGrey"></p>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    text: String,
    subtitle: String
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.empty-state {
  text-align: center;
}

.empty-state__icon {
  margin-bottom: 24px;
}

.empty-state__text {
  margin: 0 auto;
  text-align: center;
}

.empty-state__title {
  max-width: 480px;
  margin-bottom: 8px;
}
</style>
