<template>
<Dropdown ref="dropdown" class="settings">
  <template slot="button">
    <slot />
  </template>

  <Filters :section="section" :filter="filter" :metadata="metadata" @filterChanged="setFilter"/>
</Dropdown>
</template>

<script>
import Dropdown from '../Dropdowns/Dropdown';
import Filters from './Filters';

export default {
  name: 'SettingsDropdown',
  components: {
    Dropdown,
    Filters
  },
  props: {
    section: String,
    filter: String,
    metadata: {
      type: Object,
      default () {
        return { total_shared: 0 };
      }
    }
  },
  data: function () {
    return {
      isVisible: false,
      isDropdownOpen: false
    };
  },
  methods: {
    setFilter (filter) {
      this.$refs.dropdown.closeDropdown();
      this.$emit('filterChanged', filter);
    }
  }
};
</script>

<style lang="scss" scoped>
.settings {
  position: relative;
}
</style>
