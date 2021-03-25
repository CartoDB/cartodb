<template>
  <div ref="viewer">
  </div>
</template>

<script>
import init from '@carto/viewer/src/init';

/* global __MAP_API_V2_TEMPLATE__:false */
// __MAP_API_V2_TEMPLATE__ is injected via Webpack to avoid requiring
// whole package.json file
const MAPS_API_V2_TEMPLATE = __MAP_API_V2_TEMPLATE__;

export default {
  name: 'App',
  mounted () {
    this.mountViewer();
  },
  methods: {
    async mountViewer () {
      const element = this.$refs.viewer;
      const { username, type } = this.getUsernameType();

      this.props = {
        username: username,
        type: type,
        // FIXME: we need to add `mapsUrl`, it should change depends on environment. What about `region`?
        mapsUrl: MAPS_API_V2_TEMPLATE,
        query: new URLSearchParams(window.location.search + '&embed=true'),
        goBackFunction: () => {
          window.location = '/';
        }
      };
      init(element, this.props);
    },
    getUsernameType () {
      const regex = /viewer\/user\/(.*)\/(.*)/.exec(window.location.pathname);
      return { username: regex[1], type: regex[2] };
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
