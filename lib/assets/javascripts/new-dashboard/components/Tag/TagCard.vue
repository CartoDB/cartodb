<template>
  <router-link :to="{ name: 'tagSearch', params: { tag: tag.tag } }" class="link">
    <component
      :is="componentType"
      :tag="tag" />
  </router-link>
</template>

<script>
import CondensedTagCard from './CondensedTagCard';
import SimpleTagCard from './SimpleTagCard';
// import props from './shared/props';

export default {
  name: 'TagCard',
  components: {
    SimpleTagCard,
    CondensedTagCard
  },
  props: {
    tag: Object,
    condensed: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    componentType () {
      return this.condensed ? 'CondensedTagCard' : 'SimpleTagCard';
    }
  }
};
</script>
