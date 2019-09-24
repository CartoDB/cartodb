<template>
  <section class="secondarynavigation">
      <div class="secondarynavigation__content">
        <div class="secondarynavigation__title title is-caption">{{ $t('SecondaryNavigation.data') }}</div>
        <div class="secondarynavigation__tabs">
          <router-link :to="{ name: 'datasets' }" exact class="secondarynavigation__tab title is-small" active-class="is-active">
            <span>{{ $t('SecondaryNavigation.yourDatasets') }}</span>
          </router-link>
          <router-link :to="{ name: 'location_data_streams' }" class="secondarynavigation__tab title is-small" active-class="is-active">
            <span>{{ $t('SecondaryNavigation.lds') }}</span>
          </router-link>
        </div>
      </div>
  </section>
</template>

<script>

export default {
  name: 'SecondaryNavigation',
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.secondarynavigation__content {
  display: flex;
  align-items: center;
  max-width: 940px;
  margin: 0 auto;
  padding: 0;
}

.secondarynavigation {
  position: relative;
  border-bottom: 1px solid $neutral--300;

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
