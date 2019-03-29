<template>
  <div>
    <CondensedMapCardFake v-if="condensed"></CondensedMapCardFake>
    <SimpleMapCardFake v-else></SimpleMapCardFake>
  </div>
</template>

<script>
import SimpleMapCardFake from 'new-dashboard/components/MapCard/fakes/SimpleMapCardFake';
import CondensedMapCardFake from 'new-dashboard/components/MapCard/fakes/CondensedMapCardFake';

export default {
  name: 'MapCardFake',
  components: {
    SimpleMapCardFake,
    CondensedMapCardFake
  },
  props: {
    condensed: {
      type: Boolean,
      default: false
    }
  }
};
</script>
