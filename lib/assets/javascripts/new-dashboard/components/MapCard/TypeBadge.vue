<template>
  <span
  class="title is-xsmall is-semibold typeBadge"
  :class="{
    'is-kuviz': isKuviz && !inCondensedCard,
    'in-condensedCard': inCondensedCard
  }">
    {{ $t(`MapCard.type.${visualizationType}`) }}
  </span>
</template>

<script>
export default {
  name: 'TypeBadge',
  props: {
    visualizationType: {
      type: String,
      default: 'derived'
    },
    isKuviz: {
      type: Boolean,
      default: false
    },
    inCondensedCard: {
      type: Boolean,
      default: false
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.typeBadge {
  padding: 7px 8px 5px;
  border-radius: 2px;
  border-color: $badge__border-color;
  background-color: $white;
  color: $badge__color;
  text-transform: uppercase;

  &.is-kuviz {
    color: $badge-cf__color;
  }

  &.in-condensedCard {
    background-color: $badge-condensed__bg-color;
  }
}

</style>
