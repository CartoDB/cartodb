<template>
  <a :href="vizUrl" class="card map-card" :class="{'selected': selected, 'card--noHover': !activeHover}">
    <div class="card-media" :class="{'has-error': isThumbnailErrored}">
      <img :src="mapThumbnailUrl" @error="onThumbnailError" v-if="!isThumbnailErrored"/>
      <div class="MapCard-error" v-if="isThumbnailErrored"></div>
    </div>

    <span class="checkbox card-select" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <input class="checkbox-input" @click="toggleSelection" type="checkBox">
      <span class="checkbox-decoration">
        <img svg-inline src="../assets/icons/common/checkbox.svg">
      </span>
    </span>

    <div class="card-actions" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
      <span class="card-actionsSelect">
          <img src="../assets/icons/common/options.svg">
      </span>
    </div>

    <div class="card-text">
      <div class="card-header">
        <h2 class="card-title title is-caption" :class="{ 'text-overflows': titleOverflow }">
          {{ map.name }}&nbsp;
          <span class="card-favorite" :class="{'is-favorite': map.liked}" @click.prevent="toggleFavorite" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
            <img svg-inline src="../assets/icons/common/favorite.svg">
          </span>
        </h2>
        <p class="card-description text is-caption" v-if="map.description" :class="{ 'text-overflows': descriptionOverflow }">{{ map.description }}</p>
        <p class="card-description text is-caption is-txtSoftGrey" v-else>{{ $t(`mapCard.noDescription`) }}</p>
      </div>

      <ul class="card-metadata">
        <li class="card-metadataItem text is-caption">
          <span class="icon icon--privacy" :class="privacyIcon"></span>
          <p>{{ $t(`mapCard.shared.${map.privacy}`) }}</p>
        </li>

        <li class="card-metadataItem text is-caption">
          <span class="icon"><img inline-svg src="../assets/icons/maps/calendar.svg"></span>
          <p>{{ lastUpdated }}</p>
        </li>

        <li class="card-metadataItem text is-caption">
          <span class="icon"><img inline-svg src="../assets/icons/maps/tag.svg"></span>

          <ul class="card-tagList">
            <li v-for="(tag, index) in map.tags" :key="tag">
              <a href="#" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">{{ tag }}</a><span v-if="index < map.tags.length - 1">,&#32;</span>
            </li>

            <li v-if="!hasTags">
              <span>{{ $t(`mapCard.noTags`) }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </a>
</template>

<script>
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as Visualization from 'new-dashboard/core/visualization';
import { mapActions } from 'vuex';

export default {
  name: 'MapCard',
  props: {
    map: Object
  },
  data: function () {
    return {
      isThumbnailErrored: false,
      selected: false,
      activeHover: true,
      titleOverflow: false,
      descriptionOverflow: false
    };
  },
  updated: function () {
    this.$nextTick(function () {
      var title = this.$el.querySelector('.card-title');
      var description = this.$el.querySelector('.card-description');
      this.titleOverflow = title.scrollHeight > title.clientHeight;
      this.descriptionOverflow = description.scrollHeight > description.clientHeight;
    });
  },
  computed: {
    privacyIcon () {
      return `icon--${this.$props.map.privacy}`.toLowerCase();
    },
    lastUpdated () {
      return this.$t(`mapCard.lastUpdate`, { date: distanceInWordsStrict(this.$props.map.updated_at, new Date()) });
    },
    mapThumbnailUrl () {
      return Visualization.getThumbnailUrl(this.$props.map, this.$cartoModels, { width: 600, height: 280 });
    },
    hasTags () {
      return this.$props.map.tags && this.$props.map.tags.length;
    },
    vizUrl () {
      return Visualization.getURL(this.$props.map, this.$cartoModels);
    }
  },
  methods: {
    toggleSelection () {
      this.selected = !this.selected;
    },
    toggleFavorite () {
      if (this.$props.map.liked) {
        this.deleteLikeMap(this.$props.map);
      } else {
        this.likeMap(this.$props.map);
      }
    },
    mouseOverChildElement () {
      this.activeHover = false;
    },
    mouseOutChildElement () {
      this.activeHover = true;
    },
    onThumbnailError () {
      this.isThumbnailErrored = true;
    },
    ...mapActions({
      likeMap: 'maps/likeMap',
      deleteLikeMap: 'maps/deleteLikeMap'
    })
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
  background-color: $white;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: 1px solid $light-grey;
    pointer-events: none;
  }

  &:hover {
    cursor: pointer;

    &:not(.card--noHover) {
      .card-title {
        color: $primary-color;
      }
    }

    .card-select,
    .card-actions,
    .card-favorite {
      opacity: 1;
    }
  }

  &.selected {
    background-color: #F2F9FF;

    .card-actions,
    .card-select {
      opacity: 1;
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
  position: relative;
  flex-shrink: 0;
  max-height: 48px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);

  &.text-overflows {
    &::after {
      content: "...";
      position: absolute;
      right: 0;
      bottom: 0;
      padding-right: 24px;
      padding-left: 6px;
      background-image: linear-gradient(to right, #FFF0, #FFFF 4px);
    }

    .card-favorite {
      position: absolute;
      z-index: 1;
      right: 0;
      bottom: 0;
    }
  }
}

.card-description {
  max-height: 48px;
  margin-bottom: 8px;
  overflow: hidden;

  &.text-overflows {
    &::after {
      content: "...";
      position: absolute;
      right: 0;
      bottom: 0;
      padding-left: 4px;
      background-color: #FFF;
    }
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
      background-image: url("../assets/icons/maps/privacy/lock.svg");
    }

    &.icon--public {
      background-image: url("../assets/icons/maps/privacy/public.svg");
    }

    &.icon--link {
      background-image: url("../assets/icons/maps/privacy/link.svg");
    }

    &.icon--password {
      background-image: url("../assets/icons/maps/privacy/password.svg");
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
}

.card-tagList > li {
  display: inline;
}
</style>
