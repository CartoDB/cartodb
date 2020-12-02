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
  isSharedWithMe () {
    return Visualization.isSharedWithMe(this.$props.visualization, this.$cartoModels);
  },
  showViews () {
    const privacy = this.$props.visualization.privacy;
    return !this.isKuviz && !this.isKeplergl && ['public', 'password', 'link'].includes(privacy.toLowerCase());
  },
  numberViews () {
    if (this.isKuviz) {
      return this.$t(`MapCard.noViewsToDisplay`);
    }
    const stats = this.$props.visualization.stats;
    const totalViews = Object.keys(stats).reduce((total, date) => total + stats[date], 0);
    return totalViews;
  },
  showInteractiveElements () {
    return !this.$props.selectMode;
  },
  colleaguesSharedList () {
    return this.$props.visualization.permission.acl;
  },
  isSharedWithColleagues () {
    return this.$props.visualization.permission.acl.length > 0;
  },
  isBuilderMap () {
    return this.$props.visualization.type === 'derived';
  },
  isKuviz () {
    return this.$props.visualization.type === 'kuviz';
  },
  isKeplergl () {
    return this.$props.visualization.type === 'keplergl';
  },
  isSample () {
    const sample = this.$props.visualization.sample;
    return sample && !!sample.entity_id || false;
  },
  isSubscription () {
    const subscription = this.$props.visualization.subscription;
    return subscription && !!subscription.entity_id || false;
  }
};
