<template>
  <div ref="viewer">HOLA MUNDO</div>
</template>

<script>

import init from '@carto/viewer/src/init';

export default {
  name: 'TilesetsViewer',
  components: {},
  props: {},
  data () {
    return {};
  },
  computed: {},
  methods: {},
  mounted () {
    const element = this.$refs.viewer;
    const props = {
      username: 'alasarr',
      type: 'bigquery',
      query: new URLSearchParams('?data=cartobq.maps.osm_buildings')
    };
    init(element, props);
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.viewer {
  height: 500px;
}
</style>
