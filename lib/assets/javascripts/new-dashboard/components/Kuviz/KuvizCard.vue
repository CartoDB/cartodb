<template>
  <a :href="kuviz.url" target="_blank" class="kuvizCard">

    <div class="kuvizCard__column--main">
      <div class="kuvizCard__cell cell">
        <div class="kuvizCard__icon"></div>
      </div>
      <div class="cell cell--main u-flex u-flex__align--center">
        <span class="text is-caption is-txtGrey u-ellipsis kuvizCard__title">
          {{ kuviz.name }}
        </span>
      </div>
    </div>

    <div class="kuvizCard__column--extra">
      <div class="cell cell--large u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ lastUpdated }}
        </span>
      </div>
      <div class="cell cell--large u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ kuviz.privacy }}
        </span>
      </div>
    </div>
  </a>
</template>

<script>
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';

export default {
  name: 'KuvizCard',
  props: {
    kuviz: Object
  },
  computed: {
    lastUpdated () {
      return this.$t('DatasetCard.lastUpdated', { date: distanceInWordsStrict(this.$props.kuviz.updated_at, new Date()) });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.kuvizCard {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: pointer;

  &:hover {
    background-color: $softblue;
    text-decoration: none;

    .kuvizCard__title {
      color: $primary-color;
      text-decoration: underline;
    }
  }

  &__column {
    display: flex;
    justify-content: center;

    &--main {
      display: flex;
      flex: 0 0 58.3331%;
      justify-content: center;
      max-width: 58.3331%;
    }

    &--extra {
      display: flex;
      flex: 0 0 41.6665%;
      justify-content: space-between;
      max-width: 41.6665%;
    }
  }

  &__cell {
    width: 58px;
    height: 100%;
    padding-left: 0;

    &--large {
      flex-grow: 1;
      flex-shrink: 1;
      width: 280px;
    }
  }

  &__icon {
    display: flex;
    width: 48px;
    height: 48px;
    border-radius: 2px;
    background: url(/assets/1.0.0-assets.136-kp-page/images/layout/default-map-bkg.png) no-repeat center 0;
    background-size: cover;
  }
}
</style>
