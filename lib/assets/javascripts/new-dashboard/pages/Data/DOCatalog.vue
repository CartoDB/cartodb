<template>
  <section class="catalog">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :description="$t('CatalogPage.description')">
          <template slot="icon">
            <img src="../../assets/icons/section-title/catalog.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('CatalogPage.header') }}</span>
          </template>
        </SectionTitle>
      </div>
    </div>

    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>
<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';

export default {
  name: 'CatalogPage',
  components: {
    SectionTitle
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog {
  min-height: 640px;
  margin-top: 64px;

  &__filter {
    justify-content: space-between;
    height: 168px;

    &--dropdown {
      position: relative;
    }
  }
}

.full-width {
  width: 100%;
}
</style>
