<template>
  <div class="u-flex">
    <div :class="`catalogue__icon catalogue__icon--${getCSSModifier(option)}`"></div>
    <span>{{ option }}</span>
  </div>
</template>

<script>
import getCSSModifier from 'new-dashboard/utils/get-css-modifier';

export default {
  name: 'CatalogueDropdownItem',
  props: {
    option: String
  },
  methods: {
    getCSSModifier
  }
};
</script>

<style scoped lang="scss">

.catalogue__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  background-size: contain;
}
</style>
