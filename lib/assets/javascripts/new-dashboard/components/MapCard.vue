<template>
  <div class="grid-cell" :class="sizeClass">
    <a :href="vizUrl" class="card map-card" :class="{selected: selected, 'card--noHover': !activeHover}">
      <span class="checkbox card-select" @mouseover="mouseOverElement" @mouseleave="mouseOutOfElement">
        <input class="checkbox-input" @click="toggleSelection" type="checkBox">
        <span class="checkbox-decoration">
            <svg viewBox="0 0 12 12" class="checkbox-decorationMedia">
                <g fill="none">
                    <polyline class="checkbox-check" points="1.65093994 3.80255127 4.48919678 6.97192383 10.3794556 0.717346191"></polyline>
                </g>
            </svg>
        </span>
      </span>
      <div class="card-actions" @mouseover="mouseOverElement" @mouseleave="mouseOutOfElement">
        <span class="card-actionsSelect">
            <img src="../assets/icons/common/options.svg">
        </span>
      </div>
      <div class="card-media">
        <img :src=mapThumbnailUrl />
      </div>
      <div class="card-text">
        <h2 class="card-title">
          {{ map.name }}&nbsp;
          <span class="card-favorite" v-bind:class="{'is-favorite': favorite}" @click.prevent="toggleFavorite" @mouseover="mouseOverElement" @mouseleave="mouseOutOfElement">
            <svg width="16" height="17" viewBox="0 0 16 17" xmlns="http://www.w3.org/2000/svg">
              <path class="favorite-icon" d="M15.44 5.46a.75.75 0 0 0-.69-.46h-4.04L8.67.92C8.42.4 7.58.4 7.33.92L5.29 5H1.25a.75.75 0 0 0-.53 1.28l3.44 3.44-1.38 4.83a.75.75 0 0 0 1.14.82L8 12.65l4.08 2.72a.75.75 0 0 0 1.14-.82l-1.38-4.83 3.44-3.44a.75.75 0 0 0 .16-.82z" stroke="#6F757B" fill="none" fill-rule="evenodd"/>
            </svg>
          </span>
        </h2>
        <p class="card-description" v-if="map.description">{{ map.description }}</p>
        <p class="card-description" v-else>{{ $t(`mapCard.noDescription`) }}</p>
        <ul class="card-metadata">
          <li class="card-metadataItem">
            <span class="icon icon--privacy" :class="privacyIcon"></span>
            <p>{{ $t(`mapCard.shared.${map.privacy}`) }}</p>
          </li>
          <li class="card-metadataItem">
            <span class="icon"><img src="../assets/icons/maps/calendar.svg"></span>
            <p>{{ lastUpdated }}</p>
          </li>
          <li class="card-metadataItem">
            <span class="icon"><img src="../assets/icons/maps/tag.svg"></span>
            <ul class="card-tagList">
              <li v-for="(tag, index) in map.tagList" :key="tag">
                <a href="#" @mouseover="mouseOverElement" @mouseleave="mouseOutOfElement">{{ tag }}</a><span v-if="index < map.tagList.length - 1">,&#32;</span>
              </li>
              <li v-if="map.tagList.length <= 0">
                <span>{{ $t(`mapCard.noTags`) }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </a>
  </div>
</template>

<script>
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'CardMap',
  props: {
    map: Object,
    size: {
      type: String,
      default: 'small'
    }
  },
  data: function () {
    return {
      selected: false,
      favorite: this.$props.map.favorite,
      activeHover: true,
      sizeClasses: {
        medium: 'grid-cell--col6 grid-cell--col12--mobile',
        small: 'grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile'
      }
    };
  },
  computed: {
    privacyIcon () {
      return `icon--${this.$props.map.privacy}`.toLowerCase();
    },
    lastUpdated () {
      return `Updated ${distanceInWordsStrict(this.$props.map.updated_at, new Date())} ago`;
    },
    sizeClass () {
      return this.sizeClasses[this.$props.size];
    },
    mapThumbnailUrl () {
      return this.$props.map.thumbnailUrl;
    },
    vizUrl () {
      return Visualization.getURL(this.$props.map);
    }
  },
  methods: {
    toggleSelection () {
      this.selected = !this.selected;
    },
    toggleFavorite () {
      this.favorite = !this.favorite;
    },
    mouseOverElement () {
      this.activeHover = false;
    },
    mouseOutOfElement () {
      this.activeHover = true;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
    border: 1px solid rgba($textColor, 0.16);
    pointer-events: none;
  }

  &:hover {
    cursor: pointer;

    &:not(.card--noHover) {
      .card-title {
        color: $primaryColor;
      }
    }

    .card-select,
    .card-actions {
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

.card--highlight {
  display: flex;

  .card-title {
    margin-bottom: 16px;
    font-size: 24px;
  }

  .card-description {
    height: 72px;
    margin-bottom: 32px;
    -webkit-line-clamp: 3;
  }

  .card-media {
    flex: 0 0 58.3331%;
    min-width: 58.3331%;
  }

  .card-text {
    padding: 24px 36px 24px 20px;
  }
}

.card-subtitle {
  margin-bottom: 4px;
  font: 600 10px/1.6 'Montserrat';
}

.card-text {
  padding: 24px 16px;
  color: $textColor;
}

.card-media {
  display: flex;
  height: 140px;
  overflow: hidden;

  img {
    width: 100%;
    object-fit: cover;
  }
}

.card-title {
  margin-bottom: 12px;
  transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
  font: 700 18px/1.4 'Montserrat';
}

.card-description {
  display: -webkit-box;
  display: block;
  height: 48px;
  margin-bottom: 8px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font: 400 16px/1.6 'Open Sans';
  text-overflow: ellipsis;
}

.card-metadataItem {
  display: flex;
  margin-bottom: 4px;
  font: 400 16px/1.6 'Open Sans';

  a {
    color: $textColor;
    text-decoration: none;
  }

  a:hover {
    color: $textColor;
    text-decoration: underline;
  }

  .icon {
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

.card-metadataItem:last-child {
  margin-bottom: 0;
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
    background: $primaryColor;
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

.card-actionsContainer {
  position: absolute;
  z-index: 2;
  top: 32px;
  right: 0;
  border: 1px solid rgba($textColor, 0.08);
  border-radius: 2px;
  background: $white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.card-actionsListItem {
  width: 264px;
  border-bottom: 1px solid rgba($textColor, 0.08);
  font: 400 16px/1.6 'Open Sans';

  &:last-child {
    border-bottom: 0;
  }

  a {
    display: block;
    padding: 12px 24px;
    text-decoration: none;
  }
}

.card-favorite {
  margin-left: 4px;

  svg {
    transform: translateY(2px);
  }

  &:hover {
    .favorite-icon {
      stroke: $primaryColor;
    }
  }

  &.is-favorite {
    .favorite-icon {
      stroke: #FFC300;
      fill: #FFC300;
    }

    &:hover {
      .favorite-icon {
        stroke: $primaryColor;
      }
    }
  }
}

.card-development {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 36px 16px;
  background-color: $softblue;

  .card-developmentTitle {
    margin-bottom: 8px;
  }
}

.card-tagList > li {
  display: inline;
}
</style>
