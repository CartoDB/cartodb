<template>
  <div class="u-flex">
    <div :class="`catalog__icon catalog__icon--${getCSSModifier(option)}`"></div>
    <span>{{ option }}</span>
  </div>
</template>

<script>
import getCSSModifier from 'new-dashboard/utils/get-css-modifier';

export default {
  name: 'CatalogDropdownItem',
  props: {
    option: String
  },
  methods: {
    getCSSModifier
  }
};
</script>

<style scoped lang="scss">

.catalog__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  background-size: contain;
}
</style>
