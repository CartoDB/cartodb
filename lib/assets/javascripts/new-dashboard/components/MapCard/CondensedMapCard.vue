<template>
  <a :href="vizUrl"
     target="_blank"
     class="row"
     :class="{
       'row--selected': isSelected,
       'row--quick-actions-open': areQuickActionsOpen,
       'row--no-hover': !activeHover,
       'row--can-hover': canHover
     }"
     @click="onClick">

    <div class="cell cell--thumbnail">
      <div class="cell__media">
        <img class="cell__map-thumbnail" :src="mapThumbnailUrl" @error="onThumbnailError" v-if="!isThumbnailErrored"/>
      </div>

      <span class="checkbox cell__checkbox" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
        <input class="checkbox-input" :checked="isSelected" @click.stop="toggleSelection" type="checkBox">
        <span class="checkbox-decoration">
          <img svg-inline src="../../assets/icons/common/checkbox.svg">
        </span>
      </span>
    </div>

    <div class="cell cell--map-name cell--main">
      <div class="cell__title">
        <h3 class="text is-caption is-txtGrey u-ellipsis cell--map-name__text">
          {{ visualization.name }}
        </h3>

        <span v-if="showInteractiveElements" class="cell__favorite" :class="{ 'is-favorite': visualization.liked }" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <img svg-inline src="../../assets/icons/common/favorite.svg">
        </span>
      </div>

      <div class="metadata" v-if="hasTags || isShared">
        <div class="metadata__element" v-if="hasTags" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <img class="metadata__icon" svg-inline src="../../assets/icons/common/tag.svg">

          <ul class="metadata__tags" v-if="tagsChars <= maxTagsChars">
            <li v-for="(tag, index) in visualization.tags" :key="tag">
              <router-link :to="{ name: 'tagSearch', params: { tag } }" class="text is-small is-txtSoftGrey metadata__tag">{{ tag }}</router-link><span class="text is-small is-txtSoftGrey" v-if="!isLastTag(index)">,&nbsp;</span>
            </li>
          </ul>
          <FeaturesDropdown v-if="tagsChars > maxTagsChars" :list=visualization.tags linkRoute="tagSearch" feature="tag">
            <span class="metadata__tags-count text is-small is-txtSoftGrey">{{tagsLength}} {{$t(`DatasetCard.tags`)}}</span>
          </FeaturesDropdown>
        </div>
        <div class="metadata__element" v-if="isShared">
          <img class="metadata__icon" svg-inline src="../../assets/icons/common/user.svg">
          <span class="text is-small is-txtSoftGrey">{{visualization.permission.owner.username}}</span>
        </div>
      </div>
    </div>

    <div class="cell cell--large">
      <span class="text is-small is-txtSoftGrey">{{ lastUpdated }}</span>
    </div>

    <div class="cell cell--large">
      <span class="text is-small is-txtSoftGrey">{{ $tc(`MapCard.condensedViews`, numberViews )}}</span>
    </div>

    <div class="cell cell--privacy cell--medium">
      <span class="icon icon--privacy" :class="privacyIcon"></span>
      <p class="text is-small is-txtSoftGrey">
        {{ $t(`MapCard.shared.${visualization.privacy}`) }}
      </p>
    </div>

    <div class="cell quick-actions" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <div class="quick-actions__placeholder" v-if="!showInteractiveElements || isShared"></div>
      <MapQuickActions class="quick-actions__element" v-if="showInteractiveElements" :map="visualization" @open="openQuickActions" @close="closeQuickActions" @dataChanged="onDataChanged" />
    </div>
  </a>
</template>

<script>

import computed from './shared/computed';
import data from './shared/data';
import FeaturesDropdown from 'new-dashboard/components/Dropdowns/FeaturesDropdown';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import methods from './shared/methods';
import props from './shared/props';

export default {
  name: 'CondensedMapCard',
  components: {
    MapQuickActions,
    FeaturesDropdown
  },
  props,
  data,
  computed,
  methods
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 0 14px;
  background-color: #FFF;

  .cell--thumbnail {
    display: flex;
    align-items: center;
    align-self: flex-start;
    height: 100%;
    overflow: hidden;
  }

  .cell__map-thumbnail {
    width: 48px;
    height: 48px;
  }

  .cell__media {
    display: flex;
    position: relative;
    width: 48px;
    height: 48px;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    border-radius: 2px;
    background: url($assetsDir + '/images/layout/default-map-bkg.png') no-repeat center 0;
    background-size: cover;
  }

  .cell__checkbox {
    position: absolute;
    left: 22px;
    transform: translateY(250%);
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    text-decoration: none;

    &:not(.row--no-hover) {
      .cell--map-name .cell--map-name__text {
        color: $primary-color;
      }
    }

    .cell__favorite {
      opacity: 1;

      .favorite-icon {
        stroke: $text-secondary-color;
      }

      &:hover {
        .favorite-icon {
          stroke: $primary-color;
        }
      }
    }

    .metadata__tags-count,
    .metadata__tag {
      text-decoration: underline;
    }
  }

  .cell__favorite {
    display: inline-block;
    margin-left: 8px;
    transform: translate3d(0, 2px, 0);
    opacity: 0;
    vertical-align: middle;

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

  .cell--privacy {
    display: flex;
    align-items: center;

    .icon {
      display: flex;
      justify-content: center;
      width: 18px;
      height: 18px;
      margin-right: 8px;
      background-repeat: no-repeat;
      background-position: center;

      &.icon--privacy {
        background-repeat: no-repeat;
        background-position: center;
      }

      &.icon--private {
        background-image: url("../../assets/icons/maps/privacy/condensed/condensed-lock.svg");
      }

      &.icon--public {
        background-image: url("../../assets/icons/maps/privacy/condensed/condensed-public.svg");
      }

      &.icon--link {
        background-image: url("../../assets/icons/maps/privacy/condensed/condensed-link.svg");
      }

      &.icon--password {
        background-image: url("../../assets/icons/maps/privacy/condensed/condensed-password.svg");
      }

      &.icon--sharedBy {
        border-radius: 2px;
        background-size: contain;
      }
    }
  }

  .quick-actions-placeholder {
    display: block;
    width: 24px;
    height: 24px;
  }

  &.row--selected {
    box-shadow: 0 0 0 1px $primary-color;
  }

  &:hover,
  &.row--selected {
    &.row--can-hover {
      .cell__media {
        transform: translateY(-100%);
        opacity: 0;
      }

      .cell__checkbox {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
    }
  }

  &.row--quick-actions-open,
  &:hover {
    .quick-actions {
      .quick-actions__element {
        visibility: visible;
        opacity: 1;
        pointer-events: auto;
      }
    }
  }

  .cell__title {
    display: flex;
    align-items: center;
  }

  .quick-actions {
    .quick-actions__placeholder {
      width: 24px;
    }

    .quick-actions__element {
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
    }
  }

  .metadata {
    display: flex;
    align-items: center;
    margin-top: 4px;
  }

  .metadata__element {
    display: flex;
    align-items: center;
    margin-left: 16px;

    &:first-of-type {
      margin-left: 0;
    }
  }

  .metadata__icon {
    margin-right: 4px;
  }

  .metadata__tags {
    display: flex;
  }

  .metadata__tags-count,
  .metadata__tag {
    &:hover {
      color: $primary-color;
    }
  }
}
</style>
