<template>
  <div class="base-map">
    <div id="map"></div>
    <canvas id="deck-canvas"></canvas>
    <div v-if="legend" class="legend">
      <ColorCategoriesLegend
        v-if="variableCategories"
        :title="variableName"
        :categories="variableCategories"
      />
    </div>
    <div v-show="showInfo && variableDescription" class="map-info">
      <p class="is-small">{{ variableDescription }}</p>
    </div>
    <div v-if="recenter" class="recenter" @click="recenterMap">
      <img src="../../assets/icons/catalog/recenter.svg" alt="recenter">
      <p class="is-small is-semibold">Recenter</p>
    </div>
    <div class="cover" v-if="!showMap"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { CartoBQTilerLayer, BASEMAP } from '@deck.gl/carto';

import colorBinsStyle from './map-styles/colorBinsStyle';
import colorCategoriesStyle from './map-styles/colorCategoriesStyle';

import ColorCategoriesLegend from './legends/ColorCategoriesLegend';

let deck;
let propId;
let colorStyle;
let getFillColor;
let getLineColor;
let pointRadiusMinPixels;
let lineWidthMinPixels;

export default {
  name: 'BaseMap',
  props: {
    legend: Boolean,
    recenter: Boolean,
    showInfo: Boolean
  },
  components: {
    ColorCategoriesLegend
  },
  data () {
    return {
      map: null,
      showMap: false,
      variable: null,
      geomType: null,
      initialViewState: null
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      variables: state => state.catalog.variables
    }),
    title () {
      return this.dataset.name;
    },
    variableName () {
      return this.variable && this.variable.attribute;
    },
    variableDescription () {
      return this.variable && this.variable.description;
    },
    variableCategories () {
      if (this.variable && this.variable.categories) {
        const top = 10;
        const colorStyle = colorCategoriesStyle({
          categories: { stats: this.variable, top },
          colors: 'Bold'
        });
        const categories = this.variable.categories.slice(0, top).map(c => ({
          color: `rgb(${colorStyle(c.category)})`,
          name: c.category
        }));
        categories.push({
          name: 'Others',
          color: 'rgb(119, 119, 119)'
        });
        return categories;
      }
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
      attributionControl: false
    });

    deck = new Deck({
      canvas: 'deck-canvas',
      onViewStateChange: ({ viewState }) => {
        this.syncMapboxViewState(viewState);
      },
      controller: true,
      getTooltip: ({ object }) => {
        if (!object || !this.variable) return false;
        const title = this.variable.attribute;
        let value = object.properties[this.variable.attribute];
        if (value === undefined) return false;
        if (typeof value === 'number') {
          value = this.formatNumber(value);
        }
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
        };
        return { html, style };
      }
    });

    this.renderLayer();
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
    recenterMap () {
      // Hack to force initialViewState to change
      this.initialViewState.zoom += 0.000001;
      deck.setProps({ initialViewState: { ...this.initialViewState } });
      this.initialViewState.zoom -= 0.000001;
      deck.setProps({ initialViewState: { ...this.initialViewState } });
      this.syncMapboxViewState(this.initialViewState);
    },
    renderLayer () {
      const layers = [
        new CartoBQTilerLayer({
          data: this.tilesetSampleId(this.dataset.id),
          credentials: {
            username: 'public',
            apiKey: 'default_public',
            mapsUrl: 'https://maps-api-v2.carto-staging.com/user/{user}'
          },
          getFillColor,
          getLineColor,
          pointRadiusMinPixels,
          lineWidthMinPixels,
          pickable: true,
          onDataLoad: (tileJSON) => {
            console.log('TILEJSON', tileJSON);
            const { center, tilestats } = tileJSON;
            this.initialViewState = {
              zoom: parseFloat(center[2]),
              latitude: parseFloat(center[1]),
              longitude: parseFloat(center[0]),
              bearing: 0,
              pitch: 0
            };
            this.recenterMap();
            this.setGeomType(tilestats);
            this.setVariable(tilestats);
            this.resetColorStyle();
            this.generateColorStyle();
            this.renderLayer();
            this.showMap = true;
          }
        })
      ];
      deck.setProps({ layers });
    },
    setGeomType (tilestats) {
      this.geomType = tilestats.layers[0].geometry;
    },
    setVariable (tilestats) {
      const variable = tilestats.layers[0].attributes[1];
      if (!this.variables || !variable) return;
      const variableExtra = this.variables.find((v) => {
        return v.id.split('.').slice(-1)[0] === variable.attribute;
      });
      this.variable = {
        ...variable,
        ...variableExtra
      };
      console.log('VARIABLE', { ...this.variable });
    },
    formatNumber (value) {
      if (!Number.isInteger(value)) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 3
        });
      }
      return value.toLocaleString();
    },
    generateColorStyle () {
      const g = this.geomType;
      const v = this.variable && this.variable.type;
      const stats = this.variable;

      propId = this.variable && this.variable.attribute;

      if (g === 'Polygon' && v === null) {
        getFillColor = [130, 109, 186];
        getLineColor = [0, 0, 0, 100];
        lineWidthMinPixels = 0.5;
      }
      if (g === 'Polygon' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: 'OrYel'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [0, 0, 0, 100];
        lineWidthMinPixels = 0.5;
      }
      if (g === 'Polygon' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Bold'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [0, 0, 0, 100];
        lineWidthMinPixels = 0.5;
      }
      if (g === 'LineString' && v === null) {
        getLineColor = [76, 200, 163];
        lineWidthMinPixels = 2;
      }
      if (g === 'LineString' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: 'SunsetDark'
        });
        getLineColor = (d) => colorStyle(d.properties[propId]);
        lineWidthMinPixels = 2;
      }
      if (g === 'LineString' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Bold'
        });
        getLineColor = (d) => colorStyle(d.properties[propId]);
        lineWidthMinPixels = 2;
      }
      if (g === 'Point' && v === null) {
        getFillColor = [238, 77, 90];
        getLineColor = [0, 0, 0, 100];
        pointRadiusMinPixels = 4;
        lineWidthMinPixels = 0.1;
      }
      if (g === 'Point' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: 'SunsetDark'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [0, 0, 0, 100];
        pointRadiusMinPixels = 4;
        lineWidthMinPixels = 0.1;
      }
      if (g === 'Point' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Bold'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [0, 0, 0, 100];
        pointRadiusMinPixels = 4;
        lineWidthMinPixels = 0.1;
      }
    },
    resetColorStyle () {
      propId = undefined;
      colorStyle = undefined;
      getFillColor = undefined;
      getLineColor = undefined;
      pointRadiusMinPixels = undefined;
      lineWidthMinPixels = undefined;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.base-map {
  position: relative;
  height: 600px;

  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .cover {
    background: $color-primary--soft;
  }

  .legend {
    width: 240px;
    height: auto;
    margin: 20px;
    padding: 20px;
    border-radius: 4px;
    color: $neutral--700;
    background-color: white;
    box-shadow: 0 2px 8px 0 rgba(44, 44, 44, 0.16);
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

</style>
