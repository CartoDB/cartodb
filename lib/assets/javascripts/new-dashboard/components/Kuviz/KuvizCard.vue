<template>
  <a :href="kuviz.url"
  target="_blank"
  class="kuvizCard"
  :class="{
    'kuvizCard--quick-actions-open': areQuickActionsOpen,
  }"
  >

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
      <div class="cell cell--xlarge u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ lastUpdated }}
        </span>
      </div>
      <div class="cell cell--medium u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ $t(`KuvizCard.privacy.${kuviz.privacy}`) }}
        </span>
      </div>

      <div class="cell cell--last" @mouseover="mouseOverChildElement" @mouseleave="mouseOutChildElement">
        <KuvizQuickActions class="kuvizCard--quick-actions" @deleteKuviz="deleteKuviz" :kuviz="kuviz" @open="openQuickActions" @close="closeQuickActions" @contentChanged="onContentChanged" />
      </div>
    </div>
  </a>
</template>

<script>
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import KuvizQuickActions from 'new-dashboard/components/QuickActions/KuvizQuickActions';


export default {
  name: 'KuvizCard',
  components: {
    KuvizQuickActions
  },
  props: {
    kuviz: Object
  },
  data: function () {
    return {
      areQuickActionsOpen: false,
      activeHover: true,
    }
  },
  computed: {
    lastUpdated () {
      return this.$t('KuvizCard.lastUpdated', { date: distanceInWordsStrict(this.$props.kuviz.updated_at, new Date()) });
    }
  },
  methods: {
    mouseOverChildElement () {
      this.activeHover = false;
    },
    mouseOutChildElement () {
      this.activeHover = true;
    },
    openQuickActions () {
      this.areQuickActionsOpen = true;
    },
    closeQuickActions () {
      this.areQuickActionsOpen = false;
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    },
    deleteKuviz (kuviz) {
      this.$emit('deleteKuviz', kuviz);
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
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: pointer;

  &--quick-actions {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
  }

  &:hover {
    background-color: $softblue;
    text-decoration: none;

    .kuvizCard__title {
      color: $primary-color;
      text-decoration: underline;
    }
  }

  &--quick-actions-open,
  &:hover {
    .kuvizCard--quick-actions {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
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
      align-items: center;
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
