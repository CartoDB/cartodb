<template>
  <div class="tag">
    <div class="tag__title"></div>
    <div class="tag__count"></div>
    <div class="tag__count"></div>
  </div>
</template>

<script>
export default {
  name: 'FakeTagCard'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.tag {
  position: relative;
  height: 100%;
  padding: 16px;
  border: 1px solid $border-color;
  background-color: $white;
}

.tag__title,
.tag__count {
  margin-bottom: 8px;
  background-color: $softblue;
}

.tag__title {
  width: 100%;
  height: 24px;
}

.tag__count {
  width: 30%;
  height: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
