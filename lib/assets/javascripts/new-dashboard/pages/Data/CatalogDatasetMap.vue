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
          <p class="is-small">{{ description }}</p>
        </div>
        <div class="recenter" @click="recenter">
          <img src="../../assets/icons/catalog/recenter.svg" alt="recenter">
          <p class="is-small is-semibold">Recenter</p>
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
import { CartoBQTilerLayer, BASEMAP } from '@deck.gl/carto';

let deck;

export default {
  name: 'CatalogDatasetMap',
  data () {
    return {
      map: null,
      variable: null,
      infoVisible: false,
      initialViewState: {
        latitude: 0,
        longitude: 0,
        zoom: 0,
        bearing: 0,
        pitch: 0
      }
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      keyVariables: state => state.catalog.keyVariables
    }),
    title () {
      return this.dataset.name;
    },
    description () {
      return this.variable && this.variable.description;
    },
    defaultSource () {
      return this.dataset.sample_info && this.dataset.sample_info.default_source || 'Test';
    }
  },
  created () {
    this.importMapboxStyles();
  },
  mounted () {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: BASEMAP.POSITRON,
      interactive: false,
      attributionControl: false,
      center: [this.initialViewState.longitude, this.initialViewState.latitude],
      zoom: this.initialViewState.zoom
    });

    deck = new Deck({
      canvas: 'deck-canvas',
      initialViewState: this.initialViewState,
      onViewStateChange: ({ viewState }) => {
        this.syncMapboxViewState(viewState);
      },
      controller: true,
      layers: [
        new CartoBQTilerLayer({
          data: this.tilesetSampleId(this.dataset.id),
          credentials: {
            username: 'public',
            apiKey: 'default_public',
            mapsUrl: 'https://maps-api-v2.carto-staging.com/user/{user}'
          },
          getFillColor: [130, 109, 186],
          getLineColor: [0, 0, 0, 100],
          lineWidthMinPixels: 0.5,
          getLineWidth: 4,
          getRadius: 16,
          pickable: true,
          onDataLoad: (tileJSON) => {
            console.log('TILEJSON', tileJSON);
            const { center, tilestats } = tileJSON;
            this.initialViewState = {
              zoom: parseFloat(center[2]) - 1,
              latitude: parseFloat(center[1]),
              longitude: parseFloat(center[0]),
              bearing: 0,
              pitch: 0
            };
            this.recenter();
            this.variable = tilestats.layers[0].attributes[1];
            this.fetchVariable();
          }
        })
      ],
      getTooltip: ({ object }) => {
        if (!object) return false;
        const title = this.variable.name || this.variable.attribute;
        const value = object.properties[this.variable.attribute];
        if (value === undefined) return false;
        const html = `
          <p style="margin: 0 0 0 4px; color: #6f777c;">${title}</p>
          <p style="margin: 4px 0 0 4px;"><b>${value}</b></p>
        `;
        const style = {
          'padding': '8px 12px',
          'border-radius': '2px',
          'font-size': '12px',
          'color': '#162945',
          'background-color': 'white',
          'border': 'solid 1px #e6e8eb'
        }
        return { html, style };
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
    },
    syncMapboxViewState (viewState) {
      this.map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      });
    },
    recenter () {
      // Hack to force initialViewState to change
      this.initialViewState.zoom += 0.000001;
      deck.setProps({ initialViewState: { ...this.initialViewState } });
      this.initialViewState.zoom -= 0.000001;
      deck.setProps({ initialViewState: { ...this.initialViewState } });
      this.syncMapboxViewState(this.initialViewState);
    },
    async fetchVariable () {
      await this.$store.dispatch('catalog/fetchKeyVariables', {
        id: this.$route.params.datasetId,
        type: this.$route.params.type
      });
      const keyVariable = this.keyVariables.find((v) => {
        return v.id.split('.').slice(-1)[0] === this.variable.attribute;
      });
      this.variable = {
        ...this.variable,
        ...keyVariable
      };
      console.log('VARIABLE', { ...this.variable });
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
    height: 600px;
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

  .recenter {
    display: flex;
    align-items: center;
    top: auto;
    left: 0;
    bottom: 0;
    width: auto;
    height: auto;
    margin: 20px;
    padding: 8px 12px;
    border-radius: 4px;
    background-color: white;
    box-shadow: 0 2px 8px 0 rgba(44, 44, 44, 0.16);
    cursor: pointer;

    p {
      margin-left: 8px;
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
