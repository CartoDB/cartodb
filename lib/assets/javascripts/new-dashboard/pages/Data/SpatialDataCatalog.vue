<template>
  <section class="catalog do-catalog">
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>
<script>

export default {
  name: 'CatalogPage',
  components: {},
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog {
  min-height: 640px;

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
