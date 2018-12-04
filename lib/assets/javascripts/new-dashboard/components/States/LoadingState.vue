<template>
  <div class="loading-state">
    <div class="loading-state-icon">
      <img svg-inline src="../../assets/icons/common/loading.svg" class="loading-state__svg"/>
    </div>

    <h6 class="loading-state-text text is-caption is-txtSoftGrey">{{text}}</h6>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    text: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.loading-state {
  margin: 20vh 0 8vh;
  text-align: center;
}

.loading-state-icon {
  margin-bottom: 24px;
}

.loading-state__svg {
  width: 48px;
  height: 48px;
}

.loading-state-text {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}
</style>
