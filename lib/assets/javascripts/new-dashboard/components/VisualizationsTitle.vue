<template>
  <span>{{ pageTitle }}</span>
</template>

<script>
export default {
  name: 'VisualizationsTitle',
  props: {
    defaultTitle: String,
    selectedItems: Number
  },
  computed: {
    pageTitle () {
      return this.selectedItems ? this.selectedItemsTitle : this.defaultTitle;
    },
    selectedItemsTitle () {
      return this.$t('BulkActions.selected', {count: this.selectedItems});
    }
  }

};
</script>
