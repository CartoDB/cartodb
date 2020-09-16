<template>
  <div class="loading-bar"></div>
</template>

<script>
export default {
  name: 'LoadingBar'
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.loading-bar {
  position: relative;
  width: 100%;
  height: 2px;
  overflow: hidden;
  background-color: $blue--100;

  &::after {
    content: '';
    position: absolute;
    // width: 50%;
    height: 100%;
    animation-name: loading;
    animation-duration: 2s;
    animation-timing-function: cubic-bezier(0.4, 0.01, 0.165, 0.99);
    animation-iteration-count: infinite;
    background-color: $color-primary;
  }
}

@keyframes loading {
  from {
    width: 1%;
    transform: translateX(0%);
  }

  to {
    width: 50%;
    transform: translateX(200%);
  }
}
</style>
