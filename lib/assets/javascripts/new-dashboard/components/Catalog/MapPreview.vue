<template>
  <div class="map-preview">
    <BaseMap />
    <div class="overlay">
      <router-link :to="{ name: 'catalog-dataset-map' }" replace>
        Explore
      </router-link>
    </div>
  </div>
</template>

<script>
import BaseMap from 'new-dashboard/components/Catalog/BaseMap';

export default {
  name: 'PreviewMap',
  components: {
    BaseMap
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.map-preview {
  position: relative;
  height: 180px;
  margin: 12px 0;

  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .overlay {
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      font-size: 12px;
      font-weight: 600;
      line-height: 16px;
      padding: 10px 16px;
      border-radius: 4px;
      color: white;
      background:rgba(46, 60, 67, 0.8);
    }
  }
}
</style>
