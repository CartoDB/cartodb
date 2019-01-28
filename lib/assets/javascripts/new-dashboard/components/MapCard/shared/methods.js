import { mapActions } from 'vuex';

export default {
  toggleSelection () {
    this.$emit('toggleSelection', {
      map: this.$props.map,
      isSelected: !this.$props.isSelected
    });
  },
  toggleFavorite () {
    if (this.$props.visualization.liked) {
      this.deleteMapLike(this.$props.map);
    } else {
      this.likeMap(this.$props.map);
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
  ...mapActions({
    likeMap: 'maps/like',
    deleteMapLike: 'maps/deleteLike'
  }),
  onClick (event) {
    if (this.$props.selectMode) {
      event.preventDefault();
      this.toggleSelection();
    }
  }
};
