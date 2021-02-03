<template>
  <div class="viewer" ref="viewer">
    <section class="page u-flex u-flex__align--center u-flex__justify--center">
      <LoadingState primary/>
    </section>
  </div>
</template>

<script>

import ReactDOM from 'react-dom';
import init from '@carto/viewer/src/init';
import { mapState } from 'vuex';
import LoadingState from 'new-dashboard/components/States/LoadingState';

export default {
  name: 'TilesetsViewer',
  components: {
    LoadingState
  },
  props: {},
  data () {
    return {};
  },
  computed: {
    ...mapState({
      apiKey: state => state.user.api_key,
      username: state => state.user.username,
      base_url: state => state.user.base_url,
      maps_api_v2_template: state => state.config.maps_api_v2_template,
      region: state => state.config.region
    }),
    source () {
      return 'bigquery';
    },
    tileset_id () {
      return this.$route.params.id;
    }
  },
  async mounted () {
    document.body.classList.add('u-overflow-hidden');
    const element = this.$refs.viewer;
    // const backRoute = this.$router.resolve({name: 'tilesets'});
    const tileset = await this.$store.dispatch('tilesets/getTileset', { source: this.source, tileset_id: this.tileset_id, ...this.$route.query });
    const center = tileset.metadata && tileset.metadata.center && tileset.metadata.center.split(',');
    const longitude = center && parseFloat(center[0]);
    const latitude = center && parseFloat(center[1]);
    const zoom = center && parseFloat(center[2]);
    const initialViewState = { longitude, latitude, zoom };

    this.props = {
      username: this.username,
      mapsUrl: this.maps_api_v2_template,
      region: this.region,
      type: this.source,
      query: new URLSearchParams(`?data=${this.tileset_id}&api_key=${this.apiKey}${this.getColorByValue(tileset)}&initialViewState=${JSON.stringify(initialViewState)}`),
      goBackFunction: () => {
        this.$router.push({ name: 'tilesets' });
      },
      shareOptions: {
        baseUrl: `https://viewer.carto${this.base_url.includes('staging') ? '-staging' : ''}.com`,
        privacy: tileset.privacy,
        setPrivacy: this.setPrivacy
      }
    };
    init(element, this.props);
  },
  methods: {
    getColorByValue (tileset) {
      return (tileset.metadata &&
        tileset.metadata.tilestats &&
        tileset.metadata.tilestats.layers &&
        tileset.metadata.tilestats.layers[0] &&
        tileset.metadata.tilestats.layers[0].attributes &&
        tileset.metadata.tilestats.layers[0].attributes.find(a => a.attribute === 'aggregated_total') &&
        `&color_by_value=aggregated_total`) || '';
    },
    async setPrivacy (privacy) {
      const [,, table] = this.tileset_id.split('.');
      await this.$store.dispatch('tilesets/setPrivacy', { source: this.source, table, ...this.$route.query, privacy });
      this.props.shareOptions.privacy = privacy;
    }
  },
  beforeDestroy () {
    document.body.classList.remove('u-overflow-hidden');
    ReactDOM.unmountComponentAtNode(this.$refs.viewer);
  }
};
</script>

<style lang="scss" scoped>
@import "new-dashboard/styles/variables";
.viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  background-color: $white;
}
.page {
  height: 100vh;
  border: none;
}
</style>
