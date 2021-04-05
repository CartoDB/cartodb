<template>
  <div ref="viewer">
  </div>
</template>

<script>
import init from '@carto/viewer/src/init';

/* global __CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE__:false */
// __CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE__ is injected via Webpack
const CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE = __CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE__;

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
        mapsUrl: CARTO_MAPS_API_V2_EXTERNAL_URL_TEMPLATE,
        query: new URLSearchParams(window.location.search),
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
