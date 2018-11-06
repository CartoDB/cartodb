<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <slot />
    </div>
    <div class="empty-state-text">
      <h6 class="text is-caption is-txtSoftGrey">{{text}}</h6>
    </div>
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
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 20vh 0 8vh;
  border-radius: 2px;
}

.empty-state-icon {
  margin-bottom: 24px;
}

.empty-state-text {
  max-width: 480px;
}
</style>
