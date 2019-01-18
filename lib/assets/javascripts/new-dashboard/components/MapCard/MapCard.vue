<template>
  <SimpleMapCard
    v-if="!condensed"
    :map="map"
    :isSelected="isSelected"
    :canHover="canHover"
    :selectMode="selectMode"
    @toggleSelection="toggleSelection"/>
  <CondensedMapCard
    v-else
    :map="map"
    :isSelected="isSelected"
    :canHover="canHover"
    :selectMode="selectMode"
    @toggleSelection="toggleSelection"/>
</template>

<script>
import CondensedMapCard from './CondensedMapCard';
import SimpleMapCard from './SimpleMapCard';
import props from './shared/props';

export default {
  name: 'MapCard',
  props: {
    ...props,
    condensed: {
      type: Boolean,
      default: false
    }
  },
  components: {
    SimpleMapCard,
    CondensedMapCard
  },
  methods: {
    toggleSelection () {
      this.$emit('toggleSelection', {
        map: this.$props.map,
        isSelected: !this.$props.isSelected
      });
    }
  }
};
</script>
