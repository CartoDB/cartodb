<template>
  <div class="u-flex">
    <div :class="`catalogue__icon catalogue__icon--${getCSSModifier(option)}`"></div>
    <span>{{ option }}</span>
  </div>
</template>

<script>
export default {
  name: 'CatalogueDropdownItem',
  props: {
    option: String
  },
  methods: {
    getCSSModifier (option) {
      return this.replaceAll(option,' ','-').toLowerCase();
    },
    replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace);
    }
  }
}
</script>

<style scoped lang="scss">

.catalogue__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}
</style>
