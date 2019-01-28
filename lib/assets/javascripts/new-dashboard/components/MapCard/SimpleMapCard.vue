<template>
  <a :href="vizUrl"
     target="_blank"
     class="card map-card"
     :class="{
       'card--selected': isSelected,
       'card--child-hover': !activeHover,
       'card--quick-actions-open': areQuickActionsOpen,
       'card--can-hover': canHover
     }"
    @click="onClick">
    <div class="card-media" :class="{'has-error': isThumbnailErrored}">
      <img :src="mapThumbnailUrl" @error="onThumbnailError" v-if="!isThumbnailErrored"/>
      <div class="MapCard-error" v-if="isThumbnailErrored"></div>
    </div>

    <span class="checkbox card-select" v-if="!isShared" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <input class="checkbox-input" :checked="isSelected" @click.prevent="toggleSelection" type="checkBox">
      <span class="checkbox-decoration">
        <img svg-inline src="../../assets/icons/common/checkbox.svg">
      </span>
    </span>

    <div class="card-actions" v-if="showInteractiveElements" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <component
        :is="quickActionsComponent"
        :map="visualization"
        @open="openQuickActions"
        @close="closeQuickActions"
        @dataChanged="onDataChanged"></component>
    </div>

    <div class="card-text">
      <div class="card-header">
        <h2 :title="visualization.name" class="card-title title is-caption" :class="{'title-overflow': (titleOverflow || isStarInNewLine)}">
          {{ visualization.name }}&nbsp;
          <span v-if="showInteractiveElements" class="card-favorite" :class="{'is-favorite': visualization.liked, 'favorite-overflow': titleOverflow}" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img svg-inline src="../../assets/icons/common/favorite.svg">
          </span>
        </h2>
        <p class="card-description text is-caption" :title="visualization.description" v-if="visualization.description" :class="{'single-line': multilineTitle}">{{ visualization.description }}</p>
        <p class="card-description text is-caption is-txtSoftGrey" v-else>{{ $t(`MapCard.noDescription`) }}</p>
      </div>

      <ul class="card-metadata">
        <li class="card-metadataItem text is-caption" v-if="!isShared">
          <span class="icon icon--privacy" :class="privacyIcon"></span>
          <p>{{ $t(`MapCard.shared.${visualization.privacy}`) }} <span v-if="showViews">| {{ $t(`MapCard.views`, { views: numberViews })}}</span></p>
        </li>

        <li class="card-metadataItem text is-caption" v-if="isShared">
          <span class="icon icon--privacy icon--sharedBy" :style="{ backgroundImage: `url('${visualization.permission.owner.avatar_url}')` }"></span>
          <p>{{ $t(`MapCard.sharedBy`, { owner: visualization.permission.owner.username })}}</p>
        </li>

        <li class="card-metadataItem text is-caption">
          <span class="icon"><img inline-svg src="../../assets/icons/maps/calendar.svg"></span>
          <p>{{ lastUpdated }}</p>
        </li>

        <li class="card-metadataItem text is-caption">
          <span class="icon"><img inline-svg src="../../assets/icons/maps/tag.svg"></span>

          <ul class="card-tagList" v-if="tagsChars <= maxTagsChars">
            <li v-for="(tag, index) in visualization.tags" :key="tag">
              <router-link :to="{ name: 'tagSearch', params: { tag } }" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">{{ tag }}</router-link><span v-if="index < visualization.tags.length - 1">,&#32;</span>
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
import props from './shared/props';
import methods from './shared/methods';
import data from './shared/data';
import computed from './shared/computed';

export default {
  name: 'SimpleMapCard',
  components: {
    MapQuickActions,
    DatasetQuickActions,
    FeaturesDropdown
  },
  props,
  data,
  computed: {
    ...computed,
    quickActionsComponent () {
      const visualizationType = this.$props.visualization.type;

      if (visualizationType === 'table') {
        return 'DatasetQuickActions';
      }

      if (visualizationType === 'derived') {
        return 'MapQuickActions';
      }
    }
  },
  methods,
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
      this.isStarInNewLine = isStarUnderText(this.$el.querySelector('.card-title'), this.$el.querySelector('.card-favorite'));
    });
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.map-card {
  display: block;
  text-decoration: none;
}

.card {
  position: relative;
  height: 100%;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid $light-grey;
  background-color: $white;

  &:hover {
    cursor: pointer;

    &:not(.card--child-hover) {
      .card-title {
        color: $primary-color;
      }
    }

    .card-actions,
    .card-favorite {
      opacity: 1;
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
  color: $text-color;
}

.card-media {
  display: flex;
  position: relative;
  height: 140px;
  overflow: hidden;
  background: url($assetsDir + '/images/layout/default-map-bkg.png') no-repeat center 0;
  background-size: cover;

  img {
    width: 100%;
    object-fit: cover;
  }

  &.has-error {
    .MapCard-error {
      display: block;
    }
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  height: 88px;
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
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);

  &.title-overflow {
    padding-right: 24px;
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
    color: $text-color;
    text-decoration: none;
  }

  &:last-child {
    margin-bottom: 0;
  }

  a:hover {
    color: $text-color;
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
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
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

.card-actionsSelect {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: $white;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);
}

.card-favorite {
  margin-left: 4px;
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

.card-tagList > li {
  display: inline;
}
</style>
