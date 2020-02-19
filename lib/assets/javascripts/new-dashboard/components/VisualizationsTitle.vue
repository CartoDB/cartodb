<template>
  <span>{{ pageTitle }}</span>
</template>

<script>
export default {
  name: 'VisualizationsTitle',
  props: {
    defaultTitle: String,
    selectedItems: Number,
    vizQuota: Number,
    vizCount: Number,
    counterLabel: String,
    isOutOfQuota: Boolean
  },
  computed: {
    pageTitle () {
      return this.selectedItems ? this.selectedItemsTitle : this.compoundTitle;
    },
    selectedItemsTitle () {
      return this.$t('BulkActions.selected', {count: this.selectedItems});
    },
    compoundTitle () {
      return this.vizQuota && !this.isOutOfQuota ? this.titleWithCounter : this.defaultTitle;
    },
    titleWithCounter () {
      return this.counterLabel
        ? `${this.defaultTitle} (${this.counterLabel} ${this.vizCount}/${this.vizQuota})`
        : `${this.defaultTitle} (${this.vizCount}/${this.vizQuota})`;
    }
  }

};
</script>
