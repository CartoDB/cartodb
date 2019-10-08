<template>
  <section class="catalog-section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../assets/icons/section-title/catalog.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('CatalogPage.header') }}</span>
          </template>
        </SectionTitle>
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
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog-section {
  margin-top: 64px;
}

.full-width {
  width: 100%;
}

</style>
