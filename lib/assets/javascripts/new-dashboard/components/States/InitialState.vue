<template>
  <div class="initial-state">
    <div class="initial-state-icon">
      <slot name="icon"></slot>
    </div>
    <div class="initial-state-text">
      <h6 class="title is-medium is-txtGrey initial-state-title">{{title}}</h6>
      <slot name="description"></slot>
    </div>
    <div class="action-button">
      <slot name="actionButton"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InitialState',
  props: {
    title: String
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.initial-state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  padding: 36px;
  border: 2px dashed $border-color--dark;
  border-radius: 2px;
}

.initial-state-title {
  margin-bottom: 16px;
}

.initial-state-icon {
  margin-right: 36px;

  @media (max-width: $layout-tablet) {
    margin-bottom: 16px;

    img {
      width: 32px;
    }
  }
}

.initial-state-text {
  max-width: 480px;
}

.action-button {
  margin-left: auto;

  @media (max-width: $layout-tablet) {
    width: 100%;
    margin-top: 16px;
  }
}
</style>
