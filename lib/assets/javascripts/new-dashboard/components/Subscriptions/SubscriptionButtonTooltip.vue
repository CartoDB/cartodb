<template>
  <div class="subscription-button-tooltip-container">
    <slot></slot>
  </div>
</template>

<script>

export default {
  name: 'SubscriptionButtonTooltip'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.subscription-button-tooltip-container {
  height: 100%;
}

button {
  position: relative;
  outline: none;
  .tooltip {
    position: absolute;
    z-index: 1;
    background-color: $neutral--800;
    white-space: nowrap;
    padding: 8px;
    border-radius: 4px;
    left: 50%;
    transform: translate(-50%, -90%);
    top: -16px;
    pointer-events: none;
    opacity: 0;
    &::before {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 14px;
      height: 14px;
      transform: rotate(45deg) translate(-50%, 50%);
      border-top: none;
      border-left: none;
      border-radius: 2px;
      background-color: $neutral--800;
    }
    &.bgWhite {
      display: flex;
      justify-content: center;
      white-space: normal;
      background-color: transparent;
      box-shadow: none;
      width: 240px;
      top: -8px;
      padding: 0;
      &::before {
        display: none;
      }
      flex-direction: column;
      background-color: $white;
      box-shadow: 0 2px 8px 0 rgba(44, 44, 44, 0.16);
      border-radius: 4px;
      padding: 16px;
      text-align: left;
      h1 {
        font-weight: bold;
        margin-bottom: 8px;
      }
    }
  }
  &:hover {
    .tooltip {
      transition: transform 250ms ease, opacity 250ms ease;
      opacity: 1;
      transform: translate(-50%, -100%);
    }
  }
}
</style>
