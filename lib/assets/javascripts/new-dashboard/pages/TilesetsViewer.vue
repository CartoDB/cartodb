<template>
  <div ref="viewer">
    <section class="page">
      <LoadingState primary/>
    </section>
  </div>
</template>

<script>

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
      username: state => state.user.username
    }),
    source () {
      return 'bigquery';
    },
    tileset_id () {
      return this.$route.params.id;
    }
  },
  async mounted () {
    const element = this.$refs.viewer;
    const backRoute = this.$router.resolve({name: 'tilesets'});
    const tileset = await this.$store.dispatch('tilesets/getTileset', { source: this.source, tileset_id: this.tileset_id, ...this.$route.query });
    const center = tileset.metadata && tileset.metadata.center && tileset.metadata.center.split(',');
    const longitude = center && parseFloat(center[0]);
    const latitude = center && parseFloat(center[1]);
    const zoom = center && parseFloat(center[2]);
    const initialViewState = { longitude, latitude, zoom };

    this.props = {
      username: this.username,
      type: this.source,
      query: new URLSearchParams(`?data=${this.tileset_id}&api_key=${this.apiKey}${this.getColorByValue(tileset)}&initialViewState=${JSON.stringify(initialViewState)}`),
      backRoute: backRoute && backRoute.href,
      shareOptions: {
        baseUrl: 'https://viewer.carto.com',
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
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.page {
  height: 100vh;
  border: none;
}
</style>
