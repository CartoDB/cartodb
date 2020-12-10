<template>
  <div class="loading-state">
    <div class="loading-state-icon">
      <img svg-inline src="../../assets/icons/common/loading.svg"
        :class="{'loading-state__svg': true, primary}"
        :style="{height: size, width: size}"/>
    </div>

    <h6 class="loading-state-text text is-caption is-txtSoftGrey">{{text}}</h6>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    text: String,
    size: {
      type: String,
      default: '48px'
    },
    primary: Boolean
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.loading-state {
  text-align: center;
}

.loading-state-icon {
  margin-bottom: 24px;
}

.loading-state__svg {
  outline: none;

  &.primary {
    path {
      stroke: $blue--400;
      stroke-width: 2;
    }

    circle {
      stroke: $neutral--300;
      stroke-opacity: 1;
      stroke-width: 2;
    }
  }
}

.loading-state-text {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}
</style>
