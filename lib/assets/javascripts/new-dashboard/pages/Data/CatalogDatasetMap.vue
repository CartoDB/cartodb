<template>
  <div>
    <div class="viewer-container">
      <div class="header-container">
        <h1 class="title is-caption is-txtMainTextColor">{{ title }}</h1>
        <img src="../../assets/icons/catalog/button-question.svg" alt="question" @click="infoVisible = !infoVisible">
      </div>
      <div class="map-container">
        <div id="map"></div>
        <canvas id="deck-canvas"></canvas>
        <div class="map-info" v-show="infoVisible">
          <p class="is-small">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo.</p>
        </div>
      </div>
    </div>
    <div class="footer-container" v-if="defaultSource">
      <span class="is-small">
        (*) Sample not available: this preview is for&nbsp;
        <i class="is-semibold is-italic">{{ defaultSource }}</i>
      </span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { CartoBQTilerLayer, setDefaultCredentials, BASEMAP } from '@deck.gl/carto';

export default {
  name: 'CatalogDatasetMap',
  data () {
    return {
      infoVisible: false
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset
    }),
    title () {
      return this.dataset.name;
    },
    defaultSource () {
      return this.dataset.sample_info && this.dataset.sample_info.default_source || 'Test';
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
      zoom: 11 + 1
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
      controller: true,
      onViewStateChange: ({ viewState }) => {
        // Synchronize Deck.gl view with Mapbox
        map.jumpTo({
          center: [viewState.longitude, viewState.latitude],
          zoom: viewState.zoom,
          bearing: viewState.bearing,
          pitch: viewState.pitch
        });
      },
      layers: [
        new CartoBQTilerLayer({
          data: this.tilesetSampleId(this.dataset.id),
          getFillColor: [130, 109, 186],
          getLineColor: [0, 0, 0, 100],
          lineWidthMinPixels: 0.5,
          pickable: true
        })
      ],
      getTooltip: ({ object }) => {
        if (!object) return false;
        let html = '';
        for (let p in object.properties) {
          if (p === 'total_pop') {
            html += `${p}: ${object.properties[p]}<br/>`;
          }
        }
        return { html };
      }
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

.viewer-container {
  margin: 12px;
  padding: 12px;
  border-radius: 4px;
  background: $color-primary--soft;

  .header-container {
    display: flex;
    justify-content: space-between;

    img {
      width: 30px;
      height: 30px;
      cursor: pointer;
    }
  }

  .map-container {
    position: relative;
    height: 500px;
    margin-top: 6px;

    & > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .map-info {
      left: auto;
      right: 0;
      width: 240px;
      height: auto;
      padding: 20px;
      border-radius: 4px;
      background-color: white;
      box-shadow: 0 2px 8px 0 rgba(44, 44, 44, 0.16);

      p {
        color: $neutral--700;
      }
    }
  }
}

.footer-container {
  display: flex;
  justify-content: flex-end;
  margin: 24px 12px;

  span {
    display: flex;
    align-items: center;
    white-space: pre-wrap;

    &:after {
      content: url('../../assets/icons/catalog/interface-alert-triangle.svg');
      margin-left: 12px;
    }
  }
}
</style>
