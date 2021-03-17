<template>
  <a :href="vizUrl"
     class="dataset-row"
     :class="{
       'dataset-row--selected': isSelected,
       'dataset-row--quick-actions-open': areQuickActionsOpen,
       'dataset-row--no-hover': !activeHover,
       'dataset-row--can-hover': canHover
     }"
     @click="onClick">

    <div class="viz-column--main-info">
      <div class="cell cell--start cell--first">
        <div class="row-dataType">
            <div class="icon--dataType" :class="`icon--${dataType}`"></div>
        </div>
        <span class="checkbox row-checkbox" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <input class="checkbox-input" :class="{ 'is-selected': isSelected }" @click.stop.prevent="toggleSelection($event)" type="checkbox">
          <span class="checkbox-decoration">
            <img svg-inline src="../../assets/icons/common/checkbox.svg">
          </span>
        </span>
      </div>

      <div class="cell cell--main">
        <div class="title-container" @mouseover="showCopyDropdown" @mouseleave="hideCopyDropdown">
          <h3 class="text is-caption is-txtGrey u-ellipsis row-title" :title="dataset.name">
            {{ dataset.name }}
          </h3>
          <div class="dropdown-container" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <CopyDropdown :textToCopy="dataset.name" :isVisible="copyDropdownVisible" @hideDropdown="hideCopyDropdown"></CopyDropdown>
          </div>
          <span v-if="showInteractiveElements" class="card-favorite" :class="{'is-favorite': dataset.liked}" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
          </span>
        </div>
        <div class="row-metadataContainer" v-if="hasTags || isSharedWithMe || isSharedWithColleagues || isSample || isSubscription">
          <span class="tag-squared title is-xsmall letter-spacing" v-if="isSample">SAMPLE</span>
          <span class="tag-squared title is-xsmall letter-spacing" v-if="isSubscription">SUBSCRIPTION</span>
          <div class="row-metadata" v-if="hasTags" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img class="icon-metadata" src="../../assets/icons/common/tag.svg" width="14" height="14">
            <ul v-if="tagsChars <= maxTagChars" class="tag-list">
              <li v-for="(tag, index) in dataset.tags" :key="tag">
                <router-link :to="{ name: 'tagSearch', params: { tag } }" class="text is-small is-txtSoftGrey tag-list__tag">{{ tag }}</router-link><span class="text is-small is-txtSoftGrey" v-if="!isLastTag(index)">,&nbsp;</span>
              </li>
            </ul>
            <FeaturesDropdown v-if="tagsChars > maxTagChars" :list=dataset.tags linkRoute="tagSearch" feature="tag">
              <span class="tag-list__more-tags text is-small is-txtSoftGrey">{{numberTags}} {{$t(`DatasetCard.tags`)}}</span>
            </FeaturesDropdown>
          </div>
          <div class="row-metadata" v-if="isSharedWithMe">
            <img class="icon-metadata" svg-inline src="../../assets/icons/common/user.svg">
            <span class="text is-small is-txtSoftGrey">{{dataset.permission.owner.username}}</span>
          </div>
          <SharedBrief class="row-metadata u-ellipsis" v-if="isSharedWithColleagues && !isSharedWithMe" :colleagues="colleaguesSharedList" />
        </div>
      </div>
    </div>

    <div class="viz-column--extra-info">
      <div class="viz-column--status">
        <div class="cell cell--large">
          <span class="text is-small is-txtSoftGrey">{{ lastUpdated }}</span>
        </div>
        <div class="cell cell--xsmall u-txt-right">
          <span class="text is-small is-txtSoftGrey" :title="$tc('DatasetCard.numberRows', dataset.table.row_count, { count: getNumberInLocaleFormat(dataset.table.row_count) })">
            {{ numberFormatter(dataset.table.row_count) }}
          </span>
        </div>
        <div class="cell cell--small u-txt-right">
          <span class="text is-small is-txtSoftGrey">{{ humanFileSize(dataset.table.size) }}</span>
        </div>
      </div>

      <div class="viz-column--share">
        <div class="cell cell--small">
          <span class="text is-small is-txtSoftGrey" v-if="!dataset.dependent_visualizations_count">
            {{ $tc('DatasetCard.maps', 0) }}
          </span>
          <FeaturesDropdown :list="dependentVisualizationsWithUrl" v-if="dataset.dependent_visualizations_count" @mouseover.native="mouseOverChildElement" @mouseleave.native="mouseOutChildElement">
              <span class="text is-small is-txtSoftGrey dataset__dependent-visualizations">
                {{ $tc('DatasetCard.maps', dataset.dependent_visualizations_count) }}
              </span>

              <template slot="footer" v-if="dataset.dependent_visualizations_count > 10">
                + {{ $tc('DatasetCard.maps', dataset.dependent_visualizations_count - 10) }}
              </template>
          </FeaturesDropdown>
        </div>
        <div class="cell cell--xsmall">
          <span class="text is-small is-txtSoftGrey">{{ $t(`DatasetCard.shared.${dataset.privacy}`) }}</span>
        </div>
        <div class="cell cell--last" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <span class="quick-actions-placeholder" v-if="!showInteractiveElements"></span>
          <DatasetQuickActions
            v-if="showInteractiveElements"
            :dataset="dataset"
            :isSharedWithMe="isSharedWithMe"
            class="dataset--quick-actions"
            @open="openQuickActions"
            @close="closeQuickActions"
            @contentChanged="onContentChanged"/>
        </div>
      </div>
    </div>
  </a>
</template>

<script>
import DatasetQuickActions from 'new-dashboard/components/QuickActions/DatasetQuickActions';
import CopyDropdown from 'new-dashboard/components/Dropdowns/CopyDropdown';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as Visualization from 'new-dashboard/core/models/visualization';
import FeaturesDropdown from '../Dropdowns/FeaturesDropdown';
import SharedBrief from 'new-dashboard/components/SharedBrief';
import countCharsArray from 'new-dashboard/utils/count-chars-array';
import * as Formatter from 'new-dashboard/utils/formatter';

export default {
  name: 'DatasetCard',
  components: {
    DatasetQuickActions,
    FeaturesDropdown,
    SharedBrief,
    CopyDropdown
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
    },
    storeActionType: {
      type: String,
      default: 'datasets'
    }
  },
  data: function () {
    return {
      areQuickActionsOpen: false,
      activeHover: true,
      copyDropdownVisible: false,
      maxTags: 3,
      maxTagChars: 30
    };
  },
  computed: {
    lastUpdated () {
      if (this.$props.dataset.synchronization && this.$props.dataset.synchronization.updated_at) {
        return this.$t('DatasetCard.lastSynced', { date: distanceInWordsStrict(this.$props.dataset.synchronization.updated_at, new Date()) });
      } else {
        return this.$t('DatasetCard.lastUpdated', { date: distanceInWordsStrict(this.$props.dataset.updated_at, new Date()) });
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
    isSharedWithMe () {
      return Visualization.isSharedWithMe(this.$props.dataset, this.$cartoModels);
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
    },
    colleaguesSharedList () {
      return this.$props.dataset.permission.acl;
    },
    isSharedWithColleagues () {
      return this.$props.dataset.permission.acl.length > 0;
    },
    isSample () {
      const sample = this.$props.dataset.sample;
      return sample && !!sample.entity_id || false;
    },
    isSubscription () {
      const subscription = this.$props.dataset.subscription;
      return subscription && !!subscription.entity_id || false;
    }
  },
  methods: {
    toggleSelection ($event) {
      this.$emit('toggleSelection', {
        dataset: this.$props.dataset,
        isSelected: !this.$props.isSelected,
        event: $event
      });
    },
    getNumberInLocaleFormat (number) {
      return number ? number.toLocaleString() : '0';
    },
    humanFileSize (size) {
      return Formatter.humanFileSize(size);
    },
    numberFormatter (size) {
      return Formatter.numberFormatter(size);
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
    showCopyDropdown () {
      this.copyDropdownVisible = true;
    },
    hideCopyDropdown () {
      this.copyDropdownVisible = false;
    },
    openQuickActions () {
      this.areQuickActionsOpen = true;
    },
    closeQuickActions () {
      this.areQuickActionsOpen = false;
    },
    onClick (event) {
      if (this.$props.selectMode) {
        event.preventDefault();
        this.toggleSelection(event);
      }
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    },
    likeDataset (dataset) {
      this.$store.dispatch(`${this.storeActionType}/like`, dataset);
    },
    deleteLikeDataset (dataset) {
      this.$store.dispatch(`${this.storeActionType}/deleteLike`, dataset);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

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
    background-color: $softblue;

    &:not(.dataset-row--no-hover) {
      .row-title {
        color: $primary-color;
        text-decoration: underline;
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

  li {
    margin-right: 0.2em;
  }

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

.tag-squared {
  padding: 2px 4px;
  margin-right: 12px;
  border-radius: 2px;
  color: $blue--900;
  background-color: $blue--100;
  text-transform: uppercase;
}

.row-dataType {
  width: 36px;
  height: 36px;
  margin-right: 6px;
  margin-left: 6px;
  padding: 9px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-radius: 2px;
  background-color: $thumbnail__bg-color;

  .row-typeIcon {
    fill: $text__color;
  }

  &.row-dataType--premium {
    background-color: $color-premium;

    .row-typeIcon {
      fill: $white;
    }
  }
}

.row-checkbox {
  position: absolute;
  left: 12px;
  transform: translateY(250%);
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  opacity: 0;
  pointer-events: none;
}

.cell--start {
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
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

.title-container {
  display: flex;
  position: relative;
  align-items: center;
}

.dropdown-container {
  position: absolute;
  z-index: 2;
  bottom: 100%;
  margin-left: 32px;
  padding-bottom: 8px;
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

.row-metadataContainer {
  display: flex;
  align-items: center;
  margin-top: 4px;

  .row-metadata {
    margin-left: 16px;

    &:first-of-type {
      margin-left: 0;
    }

    .icon-metadata,
    .features-dropdown,
    ul,
    li {
      display: inline-block;
    }

    .icon-metadata {
      margin-right: 4px;
      transform: translate(0, 2px);
    }

    li {
      margin-right: 0.2em;
    }
  }
}
</style>
