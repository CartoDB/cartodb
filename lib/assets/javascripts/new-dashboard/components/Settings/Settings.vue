<template>
<Dropdown ref="dropdown" class="settings">
  <template slot="button">
    <slot />
  </template>

  <Filters :section="section" :filter="filter" :metadata="metadata" @filterChanged="setFilter"/>
  <Ordering :order="order" :orderDirection="orderDirection" @orderChanged="setOrder"/>
</Dropdown>
</template>

<script>
import Dropdown from '../Dropdowns/Dropdown';
import Filters from '../Settings/Filters';
import Ordering from '../Settings/Ordering';

export default {
  name: 'SettingsDropdown',
  components: {
    Dropdown,
    Filters,
    Ordering
  },
  props: {
    section: String,
    filter: String,
    order: String,
    orderDirection: String,
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
    },
    setOrder (orderSettings) {
      this.$refs.dropdown.closeDropdown();
      this.$emit('orderChanged', orderSettings);
    }
  }
};
</script>

<style lang="scss" scoped>
.settings {
  position: relative;
}
</style>
