<template>
  <section class="secondarynavigation">
      <div class="secondarynavigation__content">
        <div class="secondarynavigation__title title is-caption">{{ $t('SecondaryNavigation.data') }}</div>
        <div class="secondarynavigation__tabs">
          <router-link :to="{ name: 'datasets' }" class="secondarynavigation__tab title is-small" exact active-class="is-active" :class="{'is-active': isDatasetPage }">
            <span>{{ $t('SecondaryNavigation.yourDatasets') }}</span>
          </router-link>
          <router-link :to="{ name: 'catalog' }" class="secondarynavigation__tab title is-small" active-class="is-active">
            <span>{{ $t('SecondaryNavigation.catalog') }}</span>
          </router-link>
        </div>
      </div>
  </section>
</template>

<script>
import { isAllowed } from 'new-dashboard/core/configuration/filters';

export default {
  name: 'SecondaryNavigation',
  computed: {
    isDatasetPage () {
      return isAllowed(this.$route.params.filter);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.secondarynavigation {
  position: sticky;
  z-index: 5;
  top: 64px;
  border-bottom: 1px solid $neutral--300;
  background-color: $white;

  &__content {
    display: flex;
    align-items: center;
    max-width: 940px;
    margin: 0 auto;
    padding: 0;
  }

  &__title {
    margin-right: 48px;
  }

  &__tabs {
    display: flex;
  }

  &__tab {
    margin-right: 48px;
    padding: 24px 0 20px;
    border-bottom: 4px solid transparent;
    background: none;
    color: $color-primary;
    text-transform: none;

    &.is-active {
      border-color: $black;
      color: $black;
    }
  }
}

</style>
