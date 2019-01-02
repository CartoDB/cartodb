<template>
  <a :href="vizUrl"
     class="row"
     :class="{
       'row--selected': isSelected,
       'row--quick-actions-open': areQuickActionsOpen,
       'row--no-hover': !activeHover,
       'row--can-hover': canHover
     }"
     @click="onClick">

    <div class="cell cell--thumbnail">
      <div class="card-media">
        <img width="48" height="48" class="cell--thumbnail__img" :src="mapThumbnailUrl" @error="onThumbnailError" v-if="!isThumbnailErrored"/>
      </div>
      <span class="checkbox cell--thumbnail__checkbox" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
        <input class="checkbox-input" :checked="isSelected" @click.stop="toggleSelection" type="checkBox">
        <span class="checkbox-decoration">
          <img svg-inline src="../../assets/icons/common/checkbox.svg">
        </span>
      </span>
    </div>

    <div class="cell cell--map-name">
      <div class="title-container">
        <h3 class="text is-caption is-txtGrey u-ellipsis cell--map-name__text">{{ map.name }}</h3>

        <span v-if="showInteractiveElements" class="card-favorite" :class="{'is-favorite': map.liked, 'favorite-overflow': titleOverflow}" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
        </span>
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
        {{ $t(`MapCard.shared.${map.privacy}`) }}
      </p>
    </div>

    <div class="cell cell--actions" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <span class="quick-actions-placeholder" v-if="!showInteractiveElements"></span>
      <MapQuickActions v-if="showInteractiveElements" :map="map" @open="openQuickActions" @close="closeQuickActions" @dataChanged="onDataChanged" :hasShadow="false" />
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
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  background-color: #FFF;

  .cell--thumbnail__checkbox {
    position: absolute;
    left: 22px;
    transform: translateY(250%);
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    opacity: 0;
    pointer-events: none;
  }

  .cell {
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    padding: 0 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell--large {
    width: 150px;
  }

  .cell--medium {
    width: 120px;
  }

  .cell--thumbnail {
    display: flex;
    align-items: center;
    align-self: flex-start;
    height: 100%;
    overflow: hidden;

    &__img {
      width: 48px;
      height: 48px;
    }
  }

  .cell--map-name {
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 200px;

    .card-favorite {
      display: inline-block;
      margin-left: 8px;
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
  }

  .cell--privacy {
    display: flex;
    flex-direction: row;

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
    }
  }

  .cell--actions {
    visibility: hidden;

    .quick-actions-placeholder {
      display: block;
      width: 24px;
      height: 24px;
    }
  }

  &.row--selected {
    box-shadow: 0 0 0 1px $primary-color;
  }

  &:hover,
  &.row--selected {
    &.row--can-hover {
      .card-media {
        transform: translateY(-100%);
        opacity: 0;
      }

      .cell--thumbnail__checkbox {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
    }
  }

  &:hover {
    text-decoration: none;

    .cell--map-name {
      .cell--map-name__text {
        color: $primary-color;
      }

      .card-favorite {
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
    }

    .cell--actions {
      visibility: initial;
    }
  }

  .title-container {
    display: flex;
    align-items: center;
  }

  .card-media {
    display: flex;
    position: relative;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border-radius: 2px;
    background: url($assetsDir + '/images/layout/default-map-bkg.png') no-repeat center 0;
    background-size: cover;
  }
}
</style>
