<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <slot />
    </div>

    <h6 class="empty-state-text text is-caption is-txtSoftGrey">{{text}}</h6>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    text: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.empty-state {
  text-align: center;
}

.empty-state-icon {
  margin-bottom: 24px;
}

.empty-state-text {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}
</style>
