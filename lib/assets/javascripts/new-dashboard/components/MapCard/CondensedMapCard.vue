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

    <div class="viz-column--main-info">
      <div class="cell cell--thumbnail cell--first">
        <div class="cell__media" :class="{ 'is-kuviz': isKuviz ,'has-error': !isKuviz && isThumbnailErrored }">
          <img class="cell__map-thumbnail" :src="mapThumbnailUrl" @error="onThumbnailError" v-if="(isBuilderMap && !isThumbnailErrored) || isKeplergl"/>

          <div class="MapCard-error" v-if="!isKuviz && isThumbnailErrored"></div>
        </div>

        <span class="checkbox cell__checkbox" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <input class="checkbox-input" :class="{'is-selected': isSelected }" @click.stop.prevent="toggleSelection($event)" type="checkbox">
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

          <span v-if="showInteractiveElements && !isKeplergl" class="cell__favorite" :class="{ 'is-favorite': visualization.liked }" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
          </span>
        </div>

        <div class="metadata" v-if="hasTags || isSharedWithMe || isSharedWithColleagues">
          <div class="metadata__element" v-if="hasTags" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img class="metadata__icon" src="../../assets/icons/common/tag.svg" width="14" height="14">

            <ul class="metadata__tags" v-if="tagsChars <= maxTagsChars">
              <li v-for="(tag, index) in visualization.tags" :key="tag">
                <router-link :to="{ name: 'tagSearch', params: { tag } }" class="text is-small is-txtSoftGrey metadata__tag">{{ tag }}</router-link><span class="text is-small is-txtSoftGrey" v-if="!isLastTag(index)">,&nbsp;</span>
              </li>
            </ul>
            <FeaturesDropdown v-if="tagsChars > maxTagsChars" :list=visualization.tags linkRoute="tagSearch" feature="tag">
              <span class="metadata__tags-count text is-small is-txtSoftGrey">{{tagsLength}} {{$t(`DatasetCard.tags`)}}</span>
            </FeaturesDropdown>
          </div>

          <div class="metadata__element" v-if="isSharedWithMe">
            <img class="metadata__icon" svg-inline src="../../assets/icons/common/user.svg">
            <span class="text is-small is-txtSoftGrey">{{visualization.permission.owner.username}}</span>
          </div>

          <SharedBrief class="metadata__element u-ellipsis" v-if="isSharedWithColleagues && !isSharedWithMe" :colleagues="colleaguesSharedList" />
        </div>
      </div>
    </div>

    <div class="viz-column--extra-info">
      <div class="viz-column--statusL">
        <div class="cell cell--medium u-p--0">
          <TypeBadge :visualizationType="visualization.type" :isKuviz="isKuviz" :inCondensedCard="true" />
        </div>
        <div class="cell cell--large">
          <span class="text is-small is-txtSoftGrey">{{ lastUpdated }}</span>
        </div>
        <div class="cell cell--xsmall u-txt-right u-p--0" v-if="!isKeplergl">
          <span class="text is-small is-txtSoftGrey">{{ numberViews }}</span>
        </div>
      </div>

      <div class="viz-column--shareS">
        <div class="cell cell--small">
          <p class="text is-small is-txtSoftGrey">
            {{ $t(`MapCard.shared.${visualization.privacy}`) }}
          </p>
        </div>

        <div class="cell quick-actions cell--last" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
          <div class="quick-actions__placeholder" v-if="!showInteractiveElements || isSharedWithMe"></div>
          <MapQuickActions class="quick-actions__element" v-if="showInteractiveElements" :map="visualization" @open="openQuickActions" @close="closeQuickActions" @contentChanged="onContentChanged" />
        </div>
      </div>
    </div>
  </a>
</template>

<script>

import computed from './shared/computed';
import data from './shared/data';
import FeaturesDropdown from 'new-dashboard/components/Dropdowns/FeaturesDropdown';
import MapQuickActions from 'new-dashboard/components/QuickActions/MapQuickActions';
import SharedBrief from 'new-dashboard/components/SharedBrief';
import TypeBadge from './TypeBadge';
import methods from './shared/methods';
import props from './shared/props';

export default {
  name: 'CondensedMapCard',
  components: {
    MapQuickActions,
    FeaturesDropdown,
    SharedBrief,
    TypeBadge
  },
  props,
  data () {
    return {
      ...data(),
      thumbnailWidth: 144,
      thumbnailHeight: 144
    };
  },
  computed,
  methods: {
    ...methods,
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

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

    &.is-kuviz {
      display: block;
      background: url("../../assets/icons/maps/kuviz-map-squared-bkg.svg");
    }

    &.has-error {
      .MapCard-error {
        display: block;
      }
    }
  }

  .cell__checkbox {
    position: absolute;
    left: 12px;
    transform: translateY(250%);
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    background-color: $softblue;
    text-decoration: none;

    &:not(.row--no-hover) {
      .cell--map-name .cell--map-name__text {
        color: $primary-color;
      }

      .cell__title {
        text-decoration: underline;
      }
    }

    .cell__favorite {
      opacity: 1;

      .favorite-icon {
        stroke: $text__color--secondary;
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

  .cell--last {
    width: 38px;
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

    &:hover + .metadata .metadata__tag {
      text-decoration: none;
    }
  }

  .viz-column--shareS .cell {
    display: flex;
    align-items: center;

    .text.is-small {
      line-height: 17px;
    }
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

    .metadata__element {
      margin-left: 16px;

      &:first-of-type {
        margin-left: 0;
      }

      .metadata__icon,
      .features-dropdown,
      ul,
      li {
        display: inline-block;
      }

      .metadata__icon {
        margin-right: 4px;
        transform: translate(0, 2px);
      }

      li {
        margin-right: 0.2em;
      }
    }
  }
}
</style>
