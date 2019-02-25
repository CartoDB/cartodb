export default {
  toggleSelection ($event) {
    this.$emit('toggleSelection', {
      map: this.$props.visualization,
      isSelected: !this.$props.isSelected,
      event: $event
    });
  },
  toggleFavorite () {
    if (this.$props.visualization.liked) {
      this.$store.dispatch(`${this.$props.storeActionType}/deleteLike`, this.$props.visualization);
    } else {
      this.$store.dispatch(`${this.$props.storeActionType}/like`, this.$props.visualization);
    }
  },
  openQuickActions () {
    this.areQuickActionsOpen = true;
  },
  closeQuickActions () {
    this.areQuickActionsOpen = false;
  },
  mouseOverChildElement () {
    this.activeHover = false;
  },
  mouseOutChildElement () {
    this.activeHover = true;
  },
  onThumbnailError () {
    this.isThumbnailErrored = true;
  },
  onDataChanged () {
    this.$emit('dataChanged');
  },
  onClick (event) {
    if (this.$props.selectMode) {
      event.preventDefault();
      this.toggleSelection(event);
    }
  },
  isLastTag (index) {
    return index === this.tagsLength - 1;
  }
};
