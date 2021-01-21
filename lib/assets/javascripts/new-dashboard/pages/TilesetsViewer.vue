<template>
  <div ref="viewer"></div>
</template>

<script>

import init from '@carto/viewer/src/init';
import { mapState } from 'vuex';

export default {
  name: 'TilesetsViewer',
  components: {},
  props: {},
  data () {
    return {};
  },
  computed: {
    ...mapState({
      apiKey: state => state.user.api_key,
      username: state => state.user.username
    })
  },
  async mounted () {
    const element = this.$refs.viewer;
    const tileset = this.$route.params.id;
    const source = 'bigquery';
    let api_key = 'default_public';
    let tilejson;

    try {
      tilejson = await this.getTilejson(source, tileset, api_key);
    } catch (error) {
      if (error.message === '401') {
        api_key = this.apiKey;
        try {
          tilejson = await this.getTilejson(source, tileset, api_key);
        } catch (error) {
          console.error(`ERROR: ${error}`);
        }
      }
    }

    const props = {
      username: this.username,
      type: source,
      query: new URLSearchParams(`?data=${tileset}&api_key=${api_key}${this.getColorByValue(tilejson)}`)
    };
    init(element, props);
  },
  methods: {
    getTilejson (source, tileset, apiKey) {
      return this.$store.dispatch('tilesets/getTilejson', { source, tileset, apiKey });
    },
    getColorByValue (tilejson) {
      return (tilejson &&
        tilejson.vector_layers &&
        tilejson.vector_layers[0] &&
        tilejson.vector_layers[0].fields &&
        tilejson.vector_layers[0].fields.aggregated_total &&
        `&color_by_value=aggregated_total`) || '';
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
