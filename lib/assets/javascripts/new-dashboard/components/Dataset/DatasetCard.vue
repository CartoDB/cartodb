<template>
  <a :href="vizUrl"
     target="_blank"
     class="dataset-row"
     :class="{
       'dataset-row--selected': isSelected,
       'dataset-row--quick-actions-open': areQuickActionsOpen,
       'dataset-row--no-hover': !activeHover,
       'dataset-row--can-hover': canHover
     }"
     @click="onClick">
    <div class="cell cell--start">
      <div class="row-dataType">
          <div class="icon--dataType" :class="`icon--${dataType}`"></div>
      </div>
      <span class="checkbox row-checkbox" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
        <input class="checkbox-input" :checked="isSelected" @click.prevent="toggleSelection" type="checkBox">
        <span class="checkbox-decoration">
          <img svg-inline src="../../assets/icons/common/checkbox.svg">
        </span>
      </span>
    </div>
    <div class="cell cell--main">
      <div class="title-container">
        <h3 class="text is-caption is-txtGrey u-ellipsis row-title" :title="dataset.name">
          {{ dataset.name }}
        </h3>
        <span v-if="showInteractiveElements" class="card-favorite" :class="{'is-favorite': dataset.liked}" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <img svg-inline src="../../assets/icons/common/favorite.svg">
        </span>
      </div>
      <div class="row-metadataContainer" v-if="hasTags || isShared">
        <div class="row-metadata" v-if="hasTags" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <img class="icon-metadata" svg-inline src="../../assets/icons/common/tag.svg">
          <ul v-if="tagsChars <= maxTagChars" class="tag-list">
            <li v-for="(tag, index) in dataset.tags" :key="tag">
              <router-link :to="{ name: 'tagSearch', params: { tag } }" class="text is-small is-txtSoftGrey tag-list__tag">{{ tag }}</router-link><span class="text is-small is-txtSoftGrey" v-if="!isLastTag(index)">,&nbsp;</span>
            </li>
          </ul>
          <FeaturesDropdown v-if="tagsChars > maxTagChars" :list=dataset.tags linkRoute="tagSearch" feature="tag">
            <span class="tag-list__more-tags text is-small is-txtSoftGrey">{{numberTags}} {{$t(`DatasetCard.tags`)}}</span>
          </FeaturesDropdown>
        </div>
        <div class="row-metadata" v-if="isShared">
          <img class="icon-metadata" svg-inline src="../../assets/icons/common/user.svg">
          <span class="text is-small is-txtSoftGrey">{{dataset.permission.owner.username}}</span>
        </div>
      </div>
    </div>
    <div class="cell cell--large">
      <span class="text is-small is-txtSoftGrey">{{ lastUpdated }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey">{{ $tc(`DatasetCard.numberRows`, dataset.table.row_count) }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey">{{ humanFileSize(dataset.table.size) }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey" v-if="!dataset.dependent_visualizations_count">
        {{ $tc(`DatasetCard.maps`, 0, { n: 0 }) }}
      </span>

      <FeaturesDropdown :list="dependentVisualizationsWithUrl" v-if="dataset.dependent_visualizations_count" @mouseover.native="mouseOverChildElement" @mouseleave.native="mouseOutChildElement">
          <span class="text is-small is-txtSoftGrey dataset__dependent-visualizations">
            {{ $tc(`DatasetCard.maps`, dataset.dependent_visualizations_count, { n: dataset.dependent_visualizations_count }) }}
          </span>

          <template slot="footer" v-if="dataset.dependent_visualizations_count > 10">
            + {{ $tc(`DatasetCard.maps`, dataset.dependent_visualizations_count - 10, { n: dataset.dependent_visualizations_count - 10 }) }}
          </template>
      </FeaturesDropdown>
    </div>
    <div class="cell cell--small cell--privacy">
      <span class="icon icon--privacy" :class="privacyIcon"></span>
      <span class="text is-small is-txtSoftGrey">{{ $t(`DatasetCard.shared.${dataset.privacy}`) }}</span>
    </div>
    <div class="cell" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <span class="quick-actions-placeholder" v-if="!showInteractiveElements"></span>
      <DatasetQuickActions
        v-if="showInteractiveElements"
        :dataset="dataset"
        :isShared="isShared"
        class="dataset--quick-actions"
        @open="openQuickActions"
        @close="closeQuickActions"/>
    </div>
  </a>
</template>

<script>
import DatasetQuickActions from 'new-dashboard/components/QuickActions/DatasetQuickActions';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as Visualization from 'new-dashboard/core/models/visualization';
import { mapActions } from 'vuex';
import FeaturesDropdown from '../Dropdowns/FeaturesDropdown';
import countCharsArray from 'new-dashboard/utils/count-chars-array';

export default {
  name: 'DatasetCard',
  components: {
    DatasetQuickActions,
    FeaturesDropdown
  },
  props: {
    dataset: Object,
    isSelected: {
      type: Boolean,
      default: false
    },
    canHover: {
      type: Boolean,
      default: true
    },
    selectMode: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      areQuickActionsOpen: false,
      activeHover: true,
      maxTags: 3,
      maxTagChars: 30
    };
  },
  computed: {
    privacyIcon () {
      return `icon--${this.$props.dataset.privacy}`.toLowerCase();
    },
    lastUpdated () {
      if (this.$props.dataset.synchronization && this.$props.dataset.synchronization.updated_at) {
        return this.$t(`DatasetCard.lastSynced`, { date: distanceInWordsStrict(this.$props.dataset.synchronization.updated_at, new Date()) });
      } else {
        return this.$t(`DatasetCard.lastUpdated`, { date: distanceInWordsStrict(this.$props.dataset.updated_at, new Date()) });
      }
    },
    dataType () {
      const geometryTypes = {
        'st_multipolygon': 'polygon',
        'st_polygon': 'polygon',
        'st_multilinestring': 'line',
        'st_linestring': 'line',
        'st_multipoint': 'point',
        'st_point': 'point',
        '': 'empty'
      };
      let geometry = '';
      if (this.$props.dataset.table && this.$props.dataset.table.geometry_types && this.$props.dataset.table.geometry_types.length) {
        geometry = this.$props.dataset.table.geometry_types[0];
      }
      const currentGeometryType = geometry.toLowerCase();
      return geometryTypes[currentGeometryType] ? geometryTypes[currentGeometryType] : 'unknown';
    },
    numberTags () {
      return this.$props.dataset.tags ? this.$props.dataset.tags.length : 0;
    },
    tagsChars () {
      return countCharsArray(this.$props.dataset.tags, ', ');
    },
    hasTags () {
      return this.numberTags > 0;
    },
    isShared () {
      return Visualization.isShared(this.$props.dataset, this.$cartoModels);
    },
    showInteractiveElements () {
      return !this.$props.selectMode;
    },
    dependentVisualizationsWithUrl () {
      return this.$props.dataset.dependent_visualizations.map(visualization => {
        visualization.url = Visualization.getURL(visualization, this.$cartoModels);
        return visualization;
      });
    },
    vizUrl () {
      return Visualization.getURL(this.$props.dataset, this.$cartoModels);
    }
  },
  methods: {
    toggleSelection () {
      this.$emit('toggleSelection', {
        dataset: this.$props.dataset,
        isSelected: !this.$props.isSelected
      });
    },
    humanFileSize (size) {
      if (size === 0) {
        return '0 B';
      }
      const i = Math.floor(Math.log(size) / Math.log(1024));
      return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
    },
    toggleFavorite () {
      if (this.$props.dataset.liked) {
        this.deleteLikeDataset(this.$props.dataset);
      } else {
        this.likeDataset(this.$props.dataset);
      }
    },
    isLastTag (index) {
      return index === this.numberTags - 1;
    },
    mouseOverChildElement () {
      this.activeHover = false;
    },
    mouseOutChildElement () {
      this.activeHover = true;
    },
    openQuickActions () {
      this.areQuickActionsOpen = true;
    },
    closeQuickActions () {
      this.areQuickActionsOpen = false;
    },
    ...mapActions({
      likeDataset: 'datasets/like',
      deleteLikeDataset: 'datasets/deleteLike'
    }),
    onClick (event) {
      if (this.$props.selectMode) {
        event.preventDefault();
        this.toggleSelection();
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.dataset-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 0 14px;
  background-color: $white;

  &.dataset-row--selected {
    box-shadow: 0 0 0 1px $primary-color;
  }

  &.dataset-row--quick-actions-open,
  &:hover {
    text-decoration: none;

    .dataset--quick-actions {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }
  }

  &:hover {
    &:not(.dataset-row--no-hover) {
      .row-title {
        color: $primary-color;
      }

      .tag-list {
        .tag-list__tag {
          text-decoration: underline;
        }
      }

      .dataset__dependent-visualizations {
        text-decoration: underline;
      }
    }

    .card-favorite {
      opacity: 1;
    }

    .tag-list__more-tags {
      text-decoration: underline;
    }
  }

  &:hover,
  &.dataset-row--selected {
    &.dataset-row--can-hover {
      .row-dataType {
        transform: translateY(-100%);
        opacity: 0;
      }

      .row-checkbox {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
    }
  }
}

.tag-list {
  display: flex;

  .tag-list__tag {
    &:hover {
      color: $primary-color;
    }
  }
}

.tag-list__more-tags {
  &:hover {
    color: $primary-color;
  }
}

.row-dataType {
  width: 36px;
  height: 36px;
  padding: 9px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-radius: 4px;
  background-color: $light-grey;

  .row-typeIcon {
    fill: $text-color;
  }

  &.row-dataType--premium {
    background-color: $premium-color;

    .row-typeIcon {
      fill: $white;
    }
  }
}

.row-checkbox {
  position: absolute;
  left: 6px;
  transform: translateY(250%);
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  opacity: 0;
  pointer-events: none;
}

.row-metadataContainer {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.row-metadata {
  display: flex;
  align-items: center;
  margin-left: 16px;

  &:first-of-type {
    margin-left: 0;
  }
}

.cell {
  &:first-of-type {
    padding-left: 0;
  }

  &:last-of-type {
    padding-right: 0;
  }
}

.cell--start {
  display: flex;
  align-items: center;
  align-self: flex-start;
  height: 100%;
  overflow: hidden;
}

.cell--privacy {
  display: flex;
  align-items: center;
}

.icon--privacy {
  display: flex;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  background-repeat: no-repeat;
  background-position: center;

  &.icon--private {
    background-image: url("../../assets/icons/datasets/privacy/dataset-lock.svg");
  }

  &.icon--public {
    background-image: url("../../assets/icons/datasets/privacy/dataset-public.svg");
  }

  &.icon--link {
    background-image: url("../../assets/icons/datasets/privacy/dataset-link.svg");
  }

  &.icon--password {
    background-image: url("../../assets/icons/datasets/privacy/dataset-password.svg");
  }

  &.icon--sharedBy {
    border-radius: 2px;
    background-size: contain;
  }
}

.icon--dataType {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;

  &.icon--point {
    background-image: url("../../assets/icons/datasets/data-types/dots.svg");
  }

  &.icon--polygon {
    background-image: url("../../assets/icons/datasets/data-types/area.svg");
  }

  &.icon--line {
    background-image: url("../../assets/icons/datasets/data-types/line.svg");
  }

  &.icon--empty,
  &.icon--unknown {
    background-image: url("../../assets/icons/datasets/data-types/unknown.svg");
  }
}

.icon-metadata {
  margin-right: 4px;
}

.title-container {
  display: flex;
  align-items: center;
}

.card-favorite {
  margin-left: 8px;
  opacity: 0;

  svg {
    transform: translateY(2px);
  }

  &:hover {
    .favorite-icon {
      stroke: $primary-color;
    }
  }

  &.is-favorite {
    opacity: 1;

    .favorite-icon {
      stroke: #FFC300;
      fill: #FFC300;
    }

    &:hover {
      .favorite-icon {
        stroke: $primary-color;
      }
    }
  }
}

.dataset--quick-actions {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.quick-actions-placeholder {
  display: block;
  width: 24px;
  height: 24px;
}
</style>
