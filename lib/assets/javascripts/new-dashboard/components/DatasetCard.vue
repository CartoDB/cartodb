<template>
  <a :href="dataset.url" class="row" :class="{'selected': selected, 'card--noHover': !activeHover}">
    <div class="cell cell--start">
      <div class="row-dataType">
          <div class="icon--dataType" :class="'icon--' + dataType"></div>
        <!-- <img src="../assets/icons/datasets/data-types/{{dataType}}.svg"> -->
        <!-- {%include img/icons/rows/data-types/dots.svg%} -->
      </div>
      <span class="checkbox row-checkbox" style="margin-right: 20px;">
        <input class="checkbox-input" @click="toggleSelection" type="checkBox" name="contact" value="02">
        <span class="checkbox-decoration">
          <img svg-inline src="../assets/icons/common/checkbox.svg">
        </span>
      </span>
    </div>
    <div class="cell cell--main">
      <h3 class="text is-caption is-txtGrey u-ellipsis row-title">
        {{ dataset.name }}
      </h3>
      <div class="row-metadataContainer">
        <div class="row-metadata" v-if="numberTags > 0">
          <!-- {%include img/icons/rows/tag.svg%} -->
          <img class="icon-metadata" svg-inline src="../assets/icons/datasets/tag.svg">
          <ul class="tag-list">
            <li v-for="(tag, index) in dataset.tags" :key="tag">
              <a href="#" class="text is-small is-txtSoftGrey">{{ tag }}<span v-if="index < numberTags - 1">,&nbsp;</span></a>
            </li>
          </ul>
          <!-- <span class="text is-small is-txtBaseGrey">spain, 2018</span> -->
        </div>
        <div class="row-metadata" v-if="isShared">
          <img class="icon-metadata" svg-inline src="../assets/icons/datasets/user.svg">
          <!-- {%include img/icons/rows/user.svg%} -->
          <span class="text is-small is-txtSoftGrey">Timchung</span>
        </div>
      </div>
    </div>
    <div class="cell cell--large">
      <span class="text is-small is-txtSoftGrey">{{ lastSynced }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey">{{ numberRows }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey">{{ humanFileSize(dataset.table.size) }}</span>
    </div>
    <div class="cell cell--small">
      <span class="text is-small is-txtSoftGrey">1 map</span>
    </div>
    <div class="cell cell--small cell--privacy">
      <span class="icon icon--privacy" :class="privacyIcon"></span>
      <span class="text is-small is-txtSoftGrey">{{ $t(`DatasetCard.shared.${dataset.privacy}`) }}</span>
    </div>
    <div class="cell">
      <!-- QUICK ACTIONS -->
    </div>
  </a>
</template>

<script>
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'DatasetCard',
  props: {
    dataset: Object
  },
  data: function () {
    return {
      selected: false,
      activeHover: true
    };
  },
  computed: {
    privacyIcon () {
      return `icon--${this.$props.dataset.privacy}`.toLowerCase();
    },
    lastSynced () {
      return this.$t(`DatasetCard.lastSynced`, { date: distanceInWordsStrict(this.$props.dataset.updated_at, new Date()) });
    },
    numberRows () {
      if (this.$props.dataset.table.row_count === 1) {
        return this.$t(`DatasetCard.numberRow`, { rows: this.$props.dataset.table.row_count });
      } else {
        return this.$t(`DatasetCard.numberRows`, { rows: this.$props.dataset.table.row_count });
      }
    },
    dataType () {
      let data = this.$props.dataset.table.geometry_types[0];
      return data ? data.replace('ST_', '').toLowerCase() : '';
    },
    numberTags () {
      return this.$props.dataset.tags ? this.$props.dataset.tags.length : 0;
    },
    isShared () {
      return Visualization.isShared(this.$props.dataset, this.$cartoModels);
      // return false;
    }
  },
  methods: {
    toggleSelection () {
      this.selected = !this.selected;
    },
    humanFileSize (size) {
      var i = Math.floor(Math.log(size) / Math.log(1024));
      return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 12px 14px;
  overflow: hidden;
  border-bottom: 1px solid $light-grey;
  background-color: $white;

  &.selected {
    background-color: $softblue;
  }

  &.selected,
  &:hover {
    text-decoration: none;

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

  &:hover {
    .row-title {
      color: $primary-color;
    }
  }
}

.tag-list {
  display: flex;
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
  // top: 6px;
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
  position: relative;
  flex-grow: 0;
  flex-shrink: 0;
  padding: 0 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

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
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--large {
  width: 165px;
}

.cell--medium {
  width: 120px;
}

.cell--small {
  width: 80px;
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
    background-image: url("../assets/icons/datasets/privacy/lock.svg");
  }

  &.icon--public {
    background-image: url("../assets/icons/datasets/privacy/public.svg");
  }

  &.icon--link {
    background-image: url("../assets/icons/datasets/privacy/link.svg");
  }

  &.icon--password {
    background-image: url("../assets/icons/datasets/privacy/password.svg");
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
  background-size: cover;

  &.icon--point {
    background-image: url("../assets/icons/datasets/data-types/dots.svg");
  }

  &.icon--multipolygon {
    background-image: url("../assets/icons/datasets/data-types/area.svg");
  }
}

.icon-metadata {
  margin-right: 4px;
}
</style>
