<template>
  <section>
    <span class="checkbox dataset-select" v-if="!isShared" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement" @click="toggleSelection">
      <input class="checkbox-input" :checked="isSelected" type="checkBox">
      <span class="checkbox-decoration">
        <img svg-inline src="../assets/icons/common/checkbox.svg">
      </span>
    </span>
    <span>SEL: {{isSelected}}</span>
    <span>{{dataset.name}}</span>
    <span>FAV: {{ dataset.liked }} - </span>
    <span>Last Modified: {{dataset.updated_at }} - </span>
    <span>Rows: {{dataset.table.row_count }} - </span>
    <span>Size: {{ dataset.table.size }} - </span>
    <span>Privacy: {{dataset.table.privacy }} - </span>
    <span>Locked: {{dataset.locked }} - </span>
    <span>Geometry Types: {{ dataset.table.geometry_types }}</span>
  </section>
</template>
<script>
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'DatasetCard',
  props: {
    dataset: Object,
    isSelected: {
      type: Boolean,
      default: false
    }
  },

  data: function () {
    return {
      activeHover: true
    };
  },
  updated: function () {
    this.$nextTick(function () {
      // var title = this.$el.querySelector('.card-title');
      // var description = this.$el.querySelector('.card-description');
      // this.titleOverflow = title.scrollHeight > title.clientHeight;
      // this.descriptionOverflow = description.scrollHeight > description.clientHeight;
    });
  },
  computed: {
    vizUrl () {
      return Visualization.getURL(this.$props.dataset, this.$cartoModels);
    },
    isShared () {
      return Visualization.isShared(this.$props.dataset, this.$cartoModels);
    }
  },
  methods: {
    toggleSelection () {
      this.$emit('toggleSelection', {
        dataset: this.$props.dataset,
        isSelected: !this.$props.isSelected
      });
    },
    mouseOverChildElement () {
      this.activeHover = false;
    },
    mouseOutChildElement () {
      this.activeHover = true;
    },
    onThumbnailError () {
      this.isThumbnailErrored = true;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.card-select {
  position: absolute;
  top: 8px;
  left: 8px;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  opacity: 0;
  background: $white;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:checked {
    opacity: 1;
    background: $primary-color;
  }
}
</style>
