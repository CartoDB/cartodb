<template>
  <a :href="vizUrl"
     class="card map-card"
     :class="{
       'card--selected': isSelected,
       'card--child-hover': !activeHover,
       'card--quick-actions-open': areQuickActionsOpen,
       'card--can-hover': canHover
     }"
    @click="onClick">
    <div class="card-media" :class="{ 'is-kuviz': isKuviz ,'has-error': !isKuviz && isThumbnailErrored  }">
      <img :src="mapThumbnailUrl" @error="onThumbnailError" v-if="(isBuilderMap && !isThumbnailErrored) || isKeplergl"/>

      <div class="media-dataset" v-if="!(isBuilderMap || isKuviz || isKeplergl)">
        <img svg-inline src="../../assets/icons/datasets/dataset-icon.svg" />
      </div>

      <TypeBadge v-if="isBuilderMap || isKuviz || isKeplergl || isSample || isSubscription" class="card-badge" :visualizationType="badgeVisualizationType" :isKuviz="isKuviz" :inCondensedCard="false" />
      <div class="MapCard-error" v-if="!isKuviz && isThumbnailErrored"></div>
    </div>

    <span class="checkbox card-select" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <input class="checkbox-input" :class="{'is-selected': isSelected }" @click.stop.prevent="toggleSelection($event)"  type="checkbox">
      <span class="checkbox-decoration">
        <img svg-inline src="../../assets/icons/common/checkbox.svg">
      </span>
    </span>

    <div class="card-actions" v-if="showInteractiveElements" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <component
        :is="quickActionsComponent"

        :map="visualization"
        :dataset="visualization"
        :storeActionType="storeActionType"

        @open="openQuickActions"
        @close="closeQuickActions"
        @contentChanged="onContentChanged"></component>
    </div>

    <div class="card-text">
      <div class="card-header" :class="{ 'card-header__no-description': !sectionsToShow.description}">
        <h2 :title="visualization.name" class="card-title title is-caption" :class="{'title-overflow': (titleOverflow || isStarInNewLine) && !singleLineTitle, 'single-line': singleLineTitle}">
          <span :class="{ 'title-element': singleLineTitle }">{{ visualization.name }}</span>
          <span
            v-if="showInteractiveElements && !isKeplergl"
            class="card-favorite"
            :class="{'is-favorite': visualization.liked, 'favorite-overflow': titleOverflow}"
            @click.prevent="toggleFavorite"
            @mouseover="mouseOverChildElement"
            @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
          </span>
        </h2>
        <template v-if="sectionsToShow.description">
          <p class="card-description text is-caption" :title="visualization.description" v-if="visualization.description" :class="{'single-line': multilineTitle}">{{ visualization.description }}</p>
          <p class="card-description text is-caption is-txtSoftGrey" v-else>{{ $t(`MapCard.noDescription`) }}</p>
        </template>
      </div>

      <ul class="card-metadata">
        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.privacy && !isSharedWithMe">
          <span class="icon icon--privacy" :class="privacyIcon"></span>
          <p>{{ $t(`MapCard.shared.${visualization.privacy}`) }} <span v-if="showViews">| {{ $t(`MapCard.views`, { views: numberViews })}}</span></p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.privacy && isSharedWithMe">
          <span class="icon icon--privacy icon--sharedBy" :style="{ backgroundImage: `url('${visualization.permission.owner.avatar_url}')` }"></span>
          <p>{{ $t(`MapCard.sharedBy`, { owner: visualization.permission.owner.username })}}</p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.lastModification">
          <span class="icon"><img inline-svg src="../../assets/icons/maps/calendar.svg"></span>
          <p>{{ lastUpdated }}</p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="sectionsToShow.tags">
          <span class="icon"><img class="icon__tags" svg-inline src="../../assets/icons/common/tag.svg"></span>

          <ul class="card-tags" v-if="tagsChars <= maxTagsChars">
            <li v-for="(tag, index) in visualization.tags" :key="tag">
              <router-link class="card-tags__tag" :to="{ name: 'tagSearch', params: { tag } }" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">{{ tag }}</router-link><span v-if="index < visualization.tags.length - 1">,&#32;</span>
            </li>

            <li v-if="!tagsLength">
              <span>{{ $t(`MapCard.noTags`) }}</span>
            </li>
          </ul>
          <FeaturesDropdown v-if="tagsChars > maxTagsChars" :list=visualization.tags linkRoute="tagSearch" feature="tag">
            <span class="feature-text text is-caption is-txtGrey">{{tagsLength}} {{$t(`MapCard.tags`)}}</span>
          </FeaturesDropdown>
        </li>
      </ul>
    </div>
  </a>
</template>

<script>
import FeaturesDropdown from 'new-dashboard/components/Dropdowns/FeaturesDropdown';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import DatasetQuickActions from 'new-dashboard/components/QuickActions/DatasetQuickActions';
import TypeBadge from './TypeBadge';
import props from './shared/props';
import methods from './shared/methods';
import data from './shared/data';
import computed from './shared/computed';

export default {
  name: 'SimpleMapCard',
  components: {
    MapQuickActions,
    DatasetQuickActions,
    FeaturesDropdown,
    TypeBadge
  },
  props: {
    ...props,
    visibleSections: Array,
    singleLineTitle: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      ...data(),
      thumbnailWidth: 600,
      thumbnailHeight: 280
    };
  },
  computed: {
    ...computed,
    quickActionsComponent () {
      const visualizationType = this.$props.visualization.type;

      if (visualizationType === 'table') {
        return 'DatasetQuickActions';
      }

      if (visualizationType === 'derived' || visualizationType === 'kuviz' || visualizationType === 'keplergl') {
        return 'MapQuickActions';
      }
    },
    sectionsToShow () {
      const defaultSections = ['description', 'privacy', 'lastModification', 'tags'];
      const visibleSections = this.$props.visibleSections || defaultSections;

      return visibleSections.reduce((allSections, section) => {
        allSections[section] = true;
        return allSections;
      }, {});
    },
    badgeVisualizationType () {
      const visualizationType = this.$props.visualization.type;

      if (visualizationType === 'table') {
        if (this.isSample) {
          return 'sample';
        } else if (this.isSubscription) {
          return 'subscription';
        }
      }
      return visualizationType;
    }
  },
  methods: {
    ...methods,
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  },
  mounted: function () {
    function isStarUnderText (textNode, starNode) {
      const range = document.createRange();
      range.selectNodeContents(textNode.firstChild);
      const textBottomPosition = range.getClientRects()[0].bottom;
      const starBottomPosition = starNode.getBoundingClientRect().bottom;
      return textBottomPosition !== starBottomPosition;
    }

    this.$nextTick(function () {
      var title = this.$el.querySelector('.card-title');
      this.multilineTitle = title.offsetHeight > 30;
      this.titleOverflow = title.scrollHeight > title.clientHeight;
      this.isStarInNewLine = !this.isKeplergl && isStarUnderText(this.$el.querySelector('.card-title'), this.$el.querySelector('.card-favorite'));
    });
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.map-card {
  display: block;
  text-decoration: none;
}

.card {
  position: relative;
  height: 100%;
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid $border-color;
  border-radius: 2px;
  background-clip: padding-box;
  background-color: $white;

  &:hover {
    border-color: transparent;
    box-shadow: $card__shadow;
    cursor: pointer;

    &:not(.card--child-hover) {
      .card-title {
        color: $primary-color;
        text-decoration: underline;
      }
    }

    &.card--child-hover {
      .card-title {
        color: $text__color;
      }

      .card-tags {
        .card-tags__tag {
          text-decoration: none;
        }
      }
    }

    .card-actions,
    .card-favorite {
      opacity: 1;
    }

    .card-tags {
      .card-tags__tag {
        text-decoration: underline;
      }
    }
  }

  &.card--selected {
    border: 1px solid $primary-color;

    .card-actions {
      opacity: 1;
    }
  }

  &.card--quick-actions-open {
    .card-actions {
      opacity: 1;
    }
  }

  &.card--can-hover {
    &.card--selected,
    &.card--quick-actions-open,
    &:hover {
      .card-select {
        opacity: 1;
      }
    }
  }
}

.card-text {
  padding: 24px 16px;
  color: $text__color;
}

.card-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
}

.card-media {
  display: flex;
  position: relative;
  height: 140px;
  overflow: hidden;
  background: url($assetsDir + '/images/layout/default-map-bkg.png') no-repeat center 0;
  background-size: cover;

  &.is-kuviz {
    display: block;
    background: url("../../assets/icons/maps/kuviz-map-bkg.svg");
  }

  img {
    width: 100%;
    object-fit: cover;
  }

  &.has-error {
    .MapCard-error {
      display: block;
    }
  }

  .media-dataset {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $primary-color;
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  height: 88px;

  &.card-header__no-description {
    height: auto;
  }
}

.card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  position: relative;
  flex-shrink: 0;
  max-height: 48px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: color 300ms cubic-bezier(0.4, 0, 0.2, 1);

  &.title-overflow {
    padding-right: 24px;
  }

  .title-element {
    max-height: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.single-line {
    display: flex;
  }
}

.card-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  position: relative;
  max-height: 48px;
  margin-bottom: 8px;
  overflow: hidden;

  &.single-line {
    -webkit-line-clamp: 1;
  }
}

.card-metadataItem {
  display: flex;
  margin-bottom: 8px;

  a {
    color: $text__color;
    text-decoration: none;
  }

  &:last-child {
    margin-bottom: 0;
  }

  a:hover {
    color: $text__color;
    text-decoration: underline;
  }

  .icon {
    display: flex;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 4px;
    margin-right: 8px;

    &.icon--privacy {
      background-repeat: no-repeat;
      background-position: center;
    }

    &.icon--private {
      background-image: url("../../assets/icons/maps/privacy/lock.svg");
    }

    &.icon--public {
      background-image: url("../../assets/icons/maps/privacy/public.svg");
    }

    &.icon--link {
      background-image: url("../../assets/icons/maps/privacy/link.svg");
    }

    &.icon--password {
      background-image: url("../../assets/icons/maps/privacy/password.svg");
    }

    &.icon--sharedBy {
      border-radius: 2px;
      background-size: contain;
    }

    .icon__tags {
      width: 16px;
      height: 16px;

      g {
        fill: $text__color;
      }
    }
  }
}

.card-select {
  position: absolute;
  top: 8px;
  left: 8px;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  opacity: 0;
  background: $white;
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

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
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

  &.favorite-overflow {
    position: absolute;
    right: 0;
    bottom: -4px;
  }
}

.card-tags > li {
  display: inline;
}
</style>
