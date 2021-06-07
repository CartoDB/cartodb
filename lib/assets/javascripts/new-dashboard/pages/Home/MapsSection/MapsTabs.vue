<template>
  <ul class="MapsTabs">
    <li class="MapsTabs__item">
      <button class="button button--ghost MapsTabs__link" :class="{'is-active': cartoMapsVisible}" @click="showCartoMaps">{{ $t('MapsPage.tabs.carto') }}</button>
    </li>
    <li v-if="!isOnPremise" class="MapsTabs__item">
      <button class="button button--ghost MapsTabs__link" :class="{'is-active': keplerMapsVisible}" @click="showKeplerMaps">{{ $t('MapsPage.tabs.external') }}</button>
    </li>
  </ul>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'MapTabs',
  props: {
    cartoMapsVisible: {
      type: Boolean,
      default: true
    },
    keplerMapsVisible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      isOnPremise: 'config/isOnPremise'
    })
  },
  methods: {
    showCartoMaps () {
      this.$emit('showCartoMaps');
    },
    showKeplerMaps () {
      this.$emit('showKeplerMaps');
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.MapsTabs {
  display: flex;
  margin-bottom: 26px;
  border-bottom: 1px solid $neutral--300;

  &__item {
    position: relative;
    margin-right: 16px;
    padding: 0 16px;
    transform: translate3d(0, 1px, 0);
    font-size: 12px;
    line-height: 16px;
  }

  &__link {
    padding: 24px 0 20px;
    border-bottom: 4px solid transparent;
    border-radius: 0;

    &.is-active {
      border-color: currentColor;
      color: $text__color;
    }
  }
}
</style>
