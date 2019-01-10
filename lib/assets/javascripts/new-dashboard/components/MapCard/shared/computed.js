import * as Visualization from 'new-dashboard/core/visualization';
import countCharsArray from 'new-dashboard/utils/count-chars-array';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';

export default {
  privacyIcon () {
    return `icon--${this.$props.map.privacy}`.toLowerCase();
  },
  lastUpdated () {
    return this.$t(`MapCard.lastUpdate`, {
      date: distanceInWordsStrict(this.$props.map.updated_at, new Date())
    });
  },
  mapThumbnailUrl () {
    return Visualization.getThumbnailUrl(this.$props.map, this.$cartoModels, {
      width: 600,
      height: 280
    });
  },
  tagsLength () {
    return this.$props.map.tags ? this.$props.map.tags.length : 0;
  },
  vizUrl () {
    return Visualization.getURL(this.$props.map, this.$cartoModels);
  },
  tagsChars () {
    return countCharsArray(this.$props.map.tags, ', ');
  },
  isShared () {
    return Visualization.isShared(this.$props.map, this.$cartoModels);
  },
  showViews () {
    const privacy = this.$props.map.privacy;
    return ['public', 'password', 'link'].includes(privacy.toLowerCase());
  },
  numberViews () {
    const stats = this.$props.map.stats;
    const totalViews = Object.keys(stats).reduce((total, date) => total + stats[date], 0);
    return totalViews;
  },
  showInteractiveElements () {
    return !this.$props.selectMode;
  }
};
