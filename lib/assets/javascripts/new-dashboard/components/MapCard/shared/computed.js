import * as Visualization from 'new-dashboard/core/models/visualization';
import countCharsArray from 'new-dashboard/utils/count-chars-array';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';

export default {
  privacyIcon () {
    return `icon--${this.$props.visualization.privacy}`.toLowerCase();
  },
  lastUpdated () {
    return this.$t(`MapCard.lastUpdate`, {
      date: distanceInWordsStrict(this.$props.visualization.updated_at, new Date())
    });
  },
  mapThumbnailUrl () {
    return Visualization.getThumbnailUrl(this.$props.visualization, this.$cartoModels, {
      width: this.thumbnailWidth,
      height: this.thumbnailHeight
    });
  },
  tagsLength () {
    return this.$props.visualization.tags ? this.$props.visualization.tags.length : 0;
  },
  hasTags () {
    return this.$props.visualization.tags && this.$props.visualization.tags.length;
  },
  vizUrl () {
    return Visualization.getURL(this.$props.visualization, this.$cartoModels);
  },
  tagsChars () {
    return countCharsArray(this.$props.visualization.tags, ', ');
  },
  isShared () {
    return Visualization.isShared(this.$props.visualization, this.$cartoModels);
  },
  showViews () {
    const privacy = this.$props.visualization.privacy;
    return ['public', 'password', 'link'].includes(privacy.toLowerCase());
  },
  numberViews () {
    const stats = this.$props.visualization.stats;
    const totalViews = Object.keys(stats).reduce((total, date) => total + stats[date], 0);
    return totalViews;
  },
  showInteractiveElements () {
    return !this.$props.selectMode;
  },
  sharedWithColleagues () {
    return this.$props.visualization.permission.acl;
  },
  isSharedWithColleagues () {
    return this.$props.visualization.permission.acl.length > 0;
  }
};
