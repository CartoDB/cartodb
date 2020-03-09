<template>
  <div class="map-fake-card">
    <div class="image-placeholder"></div>
    <div class="text-container-placeholder">
      <div class="text-placeholder"></div>
      <div class="text-placeholder text-placeholder--double" v-if="sectionsToShow.description"></div>
      <div class="text-placeholder" v-if="sectionsToShow.privacy"></div>
      <div class="text-placeholder" v-if="sectionsToShow.lastModification"></div>
      <div class="text-placeholder" v-if="sectionsToShow.tags"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleMapCardFake',
  props: {
    visibleSections: {
      type: Array,
      default: () => ['description', 'privacy', 'lastModification', 'tags']
    }
  },
  computed: {
    sectionsToShow () {
      const visibleSections = this.$props.visibleSections || [];

      return visibleSections.reduce((allSections, section) => {
        allSections[section] = true;
        return allSections;
      }, {});
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.map-fake-card {
  border: 1px solid $border-color;
  border-radius: 2px;
  background-color: $white;
}

.image-placeholder {
  width: 100%;
  height: 140px;
  background-color: $softblue;
}

.text-container-placeholder {
  padding: 24px 16px;
}

.text-placeholder {
  width: 100%;
  height: 24px;
  margin-bottom: 8px;
  background-color: $softblue;

  &.text-placeholder--double {
    height: 48px;
  }

  &:last-of-type {
    margin-bottom: 0;
  }
}
</style>
