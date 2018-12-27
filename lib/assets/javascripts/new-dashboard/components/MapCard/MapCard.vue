<template>
  <SimpleMapCard
    v-if="!condensed"
    :map="map"
    :isSelected="isSelected"
    :canHover="canHover"
    :selectMode="selectMode"
    @toggleSelection="toggleSelection"
    @toggleFavorite="toggleFavorite"/>
  <CondensedMapCard
    v-else
    :map="map"
    :isSelected="isSelected"
    :canHover="canHover"
    :selectMode="selectMode"
    @toggleSelection="toggleSelection"
    @toggleFavorite="toggleFavorite"/>
</template>

<script>
import CondensedMapCard from './CondensedMapCard';
import SimpleMapCard from './SimpleMapCard';

export default {
  name: 'MapCard',
  props: {
    condensed: {
      type: Boolean,
      default: false
    },
    map: Object,
    isSelected: {
      type: Boolean,
      default: false
    },
    canHover: {
      type: Boolean,
      default: true
    },
    selectMode: {
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
