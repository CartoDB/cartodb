<template>
<Dropdown ref="dropdown">
  <template slot="button">
    <slot />
  </template>

  <Filters :section="section" :filter="filter" :metadata="metadata" @filterChanged="setFilter"/>
  <MapsOrdering :order="order" :orderDirection="orderDirection" @orderChanged="setOrder"/>
</Dropdown>
</template>

<script>
import Dropdown from './Dropdown';
import Filters from '../Settings/Filters';
import MapsOrdering from '../Settings/Ordering/MapsOrdering';

export default {
  name: 'FilterDropdown',
  components: {
    Dropdown,
    Filters,
    MapsOrdering
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

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.dropdown__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 9px;
  border-radius: 2px;

  &.dropdown__toggle--active {
    background-color: #F2F6F9;
  }
}
</style>
