<template>
  <div class="map-preview">
    <div id="map"></div>
    <canvas id="deck-canvas"></canvas>
    <div class="overlay">
      <router-link :to="{ name: 'catalog-dataset-map' }" replace>
        Explore
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { CartoBQTilerLayer, setDefaultCredentials, BASEMAP } from '@deck.gl/carto';

export default {
  name: 'PreviewMap',
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset
    }),
    name () {
      return this.dataset.name;
    }
  },
  created () {
    this.importMapboxStyles();
  },
  mounted () {
    // Testing ID: acs_sociodemogr_b758e778

    setDefaultCredentials({
      username: 'public',
      apiKey: 'default_public',
      mapsUrl: 'https://maps-api-v2.carto-staging.com/user/{user}'
    });

    const INITIAL_VIEW_STATE = {
      latitude: 40.750736,
      longitude: -73.973674,
      zoom: 11 + 1.5
    };

    const map = new mapboxgl.Map({
      container: 'map',
      style: BASEMAP.POSITRON,
      interactive: false,
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      attributionControl: false
    });

    const deck = new Deck({
      canvas: 'deck-canvas',
      initialViewState: INITIAL_VIEW_STATE,
      layers: [
        new CartoBQTilerLayer({
          data: this.tilesetSampleId(this.dataset.id),
          getFillColor: [130, 109, 186],
          getLineColor: [0, 0, 0, 100],
          lineWidthMinPixels: 0.5
        })
      ]
    });
  },
  methods: {
    importMapboxStyles () {
      let style = document.createElement('link');
      style.type = 'text/css';
      style.rel = 'stylesheet';
      style.href = 'https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css';
      document.head.appendChild(style);
    },
    tilesetSampleId (id) {
      const TILESET_SAMPLE_PROJECT_MAP = {
        'carto-do': 'do-tileset-sample-stag',
        'carto-do-public-data': 'do-public-tileset-sample-stag'
      };
      const [project, dataset, table] = id.split('.');
      return [TILESET_SAMPLE_PROJECT_MAP[project], dataset, table].join('.');
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.map-preview {
  position: relative;
  height: 180px;
  width: 100%;
  margin: 12px 0;

  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .overlay {
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      font-size: 12px;
      font-weight: 600;
      line-height: 16px;
      padding: 10px 16px;
      border-radius: 4px;
      color: white;
      background:rgba(46, 60, 67, 0.8);
    }
  }
}
</style>
