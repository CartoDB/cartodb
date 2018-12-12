<template>
  <div class="card-row">
    <div class="card-cell cell--start">
      <div class="row-image" v-if="dataType">
          <div class="icon" :class="`icon--${dataType}`"></div>
      </div>
      <div class="row-image row-image--map row-image--large" v-if="image">
          <div class="icon icon--image" :style="`background-image: url('${image}')`"  @error="onThumbnailError" v-if="!isThumbnailErrored"></div>
      </div>
    </div>
    <div class="card-cell cell--main">
      <div class="title-container">
        <h3 class="text is-caption is-txtGrey u-ellipsis row-title" :title='name'>
          {{name}}
        </h3>
      </div>
    </div>
    <div class="card-cell cell--download">
      <a class="title is-small is-txtPrimary" href="#">Download</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DownloadCard',
  props: {
    name: String,
    dataType: String,
    image: String
  },
  methods: {
    onThumbnailError () {
      this.isThumbnailErrored = true;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.card-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 0 24px 0 14px;
  background-color: $white;
}

.row-image {
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

  &.row-image--large {
    width: 48px;
    height: 48px;
    padding: 0;
  }

  &.row-image--map {
    background: url($assetsDir + '/images/layout/default-map-bkg.png') no-repeat center 0;
  }
}

.card-cell {
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
  overflow: hidden;
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--download {
  display: flex;
  align-items: center;
}

.icon {
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

  &.icon--image {
    background-size: cover;
  }
}

.title-container {
  display: flex;
  align-items: center;
}
</style>
