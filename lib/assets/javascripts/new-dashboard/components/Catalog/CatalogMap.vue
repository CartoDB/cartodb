<template>
  <div class="base-map">
    <div id="map"></div>
    <canvas id="deck-canvas"></canvas>
    <div v-if="legend && !isGeography" class="legend">
      <ColorBinsLegend
        v-if="variableMax"
        :title="variableName"
        :min="variableMin"
        :max="variableMax"
        :avg="variableAvg"
        :bins="variableBins"
      />
      <ColorCategoriesLegend
        v-else-if="variableCategories"
        :title="variableName"
        :categories="variableCategories"
      />
    </div>
    <div v-show="showInfo && variableDescription" class="map-info">
      <p class="is-small">{{ variableDescription }}</p>
    </div>
    <div v-show="recenter && !centered" class="recenter" @click="recenterMap">
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

import ColorBinsLegend from './legends/ColorBinsLegend';
import ColorCategoriesLegend from './legends/ColorCategoriesLegend';

let deck;
let propId;
let colorStyle;
let getFillColor;
let getLineColor;
let getLineWidth;
let getRadius;

const CATEGORY_PALETTES = {
  demographics: 'BrwnYl',
  environmental: 'BluGrn',
  derived: 'Teal',
  housing: 'Burg',
  human_mobility: 'RedOr',
  road_traffic: 'Sunset',
  financial: 'PurpOr',
  covid19: 'Peach',
  behavioral: 'TealGrn'
};

export default {
  name: 'CatalogMap',
  props: {
    legend: Boolean,
    recenter: Boolean,
    showInfo: Boolean
  },
  components: {
    ColorBinsLegend,
    ColorCategoriesLegend
  },
  data () {
    return {
      map: null,
      showMap: false,
      variable: null,
      geomType: null,
      initialViewState: null,
      centered: false
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
    categoryId () {
      console.log('CATEGORY ID:', this.dataset.category_id);
      return this.dataset.category_id;
    },
    categoryIdPalette () {
      return CATEGORY_PALETTES[this.categoryId] || 'OrYel';
    },
    isGeography () {
      return this.$route.params.entity_type === 'geography';
    },
    variableName () {
      return this.variable && this.variable.attribute;
    },
    variableDescription () {
      return this.variable && this.variable.description;
    },
    variableMin () {
      return this.formatNumber(this.variable && this.variable.min);
    },
    variableMax () {
      return this.formatNumber(this.variable && this.variable.max);
    },
    variableAvg () {
      return this.formatNumber(this.variable && this.variable.avg);
    },
    variableBins () {
      if (this.variable && this.variable.quantiles && colorStyle) {
        const breaks = [...this.variable.quantiles[2]['5'], this.variable.max];
        const bins = [...new Set(breaks)].map(q => ({
          color: `rgb(${colorStyle(q)})`
        }));
        return bins;
      }
    },
    variableCategories () {
      if (this.variable && this.variable.categories && colorStyle) {
        const categories = this.variable.categories.slice(0, 10).map(c => ({
          color: `rgb(${colorStyle(c.category)})`,
          name: c.category
        }));
        categories.push({
          name: 'OTHERS',
          color: 'rgb(165, 170, 153)'
        });
        return categories;
      }
    },
    tilesetSampleId () {
      const TILESET_SAMPLE_PROJECT_MAP = {
        'do-sample-prod': 'do-tileset-sample',
        'do-public-sample': 'do-public-tileset-sample'
        // To test in staging
        // 'do-sample-prod': 'do-tileset-sample-stag',
        // 'do-public-sample': 'do-public-tileset-sample-stag'
      };
      const [project, dataset, table] = this.dataset.sample_info.id.split('.');
      return [TILESET_SAMPLE_PROJECT_MAP[project], dataset, table].join('.');
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
      getTooltip: ({ x, y, object }) => {
        if (!object || !this.variable) return false;
        const title = this.variable.attribute;
        let html = `<p style="margin: 0 0 0 4px; color: #6f777c;">${title}</p>`;
        const objects = deck.pickMultipleObjects({ x, y })
          // Remove duplicated objects
          .filter((v, i, a) => a.findIndex(t => (t.index === v.index)) === i);
        let countNoData = 0;
        for (let o of objects) {
          if (this.compare(o.object.geometry.coordinates, object.geometry.coordinates)) {
            // Display the points that are fully overlapped (same coordinates)
            let value = o.object.properties[this.variable.attribute];
            if (value !== undefined && value !== null) {
              if (typeof value === 'number') {
                value = this.formatNumber(value);
              }
              html += `<p style="margin: 4px 0 0 4px;"><b>${value}</b></p>`;
            } else {
              countNoData += 1;
            }
          }
        }
        if (countNoData > 0) {
          let value = 'No data';
          if (countNoData > 1) {
            value += ` (${countNoData})`;
          }
          html += `<p style="margin: 4px 0 0 4px;"><b>${value}</b></p>`;
        }
        const style = {
          'padding': '8px 12px',
          'border-radius': '2px',
          'font-size': '12px',
          'font-family': "'Open Sans', 'Helvetica Neue', Helvetica, sans-serif",
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
    syncMapboxViewState (viewState) {
      this.map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      });
      this.centered = this.initialViewState.zoom === viewState.zoom &&
        this.initialViewState.latitude === viewState.latitude &&
        this.initialViewState.longitude === viewState.longitude;
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
          data: this.tilesetSampleId,
          credentials: {
            username: 'public',
            apiKey: 'default_public'
            // To test in staging:
            // mapsUrl: 'https://maps-api-v2.carto-staging.com/user/{user}'
          },
          getFillColor,
          getLineColor,
          getLineWidth,
          getRadius,
          lineWidthUnits: 'pixels',
          pointRadiusUnits: 'pixels',
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
      const attributes = tilestats.layers[0].attributes;
      const variable = attributes[1] || attributes[0]; // Default geoid
      if (!this.variables || !variable) return;
      const variableExtra = this.variables.find((v) => {
        return v.id.split('.').slice(-1)[0] === variable.attribute;
      });
      if (variable.quantiles && variable.quantiles.length === undefined) {
        // Compatibility change: convert JSON into array
        variable.quantiles = Object.keys(variable.quantiles).map(k => ({ [k]: variable.quantiles[k] }));
      }
      this.variable = {
        ...variable,
        ...variableExtra
      };
      console.log('VARIABLE', { ...this.variable });
    },
    formatNumber (value) {
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value)) {
          return value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }
        return value.toLocaleString();
      }
    },
    generateColorStyle () {
      const g = this.geomType;
      const v = this.variable && this.variable.type;
      const stats = this.variable;

      propId = this.variable && this.variable.attribute;

      if (g === 'Polygon' && this.isGeography) {
        getFillColor = [234, 200, 100, 168];
        getLineColor = [44, 44, 44, 60];
        getLineWidth = 1;
      } else if (g === 'Polygon' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: this.categoryIdPalette
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [44, 44, 44, 60];
        getLineWidth = 1;
      } else if (g === 'Polygon' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Prism'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [44, 44, 44, 60];
        getLineWidth = 1;
      } else if (g === 'LineString' && this.isGeography) {
        getLineColor = [234, 200, 100, 168];
        getLineWidth = 2;
      } else if (g === 'LineString' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: this.categoryIdPalette
        });
        getLineColor = (d) => colorStyle(d.properties[propId]);
        getLineWidth = 2;
      } else if (g === 'LineString' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Prism'
        });
        getLineColor = (d) => colorStyle(d.properties[propId]);
        getLineWidth = 2;
      } else if (g === 'Point' && this.isGeography) {
        getFillColor = [234, 200, 100, 168];
        getLineColor = [44, 44, 44, 60];
        getLineWidth = 1;
        getRadius = 4;
      } else if (g === 'Point' && v === 'Number') {
        colorStyle = colorBinsStyle({
          breaks: { stats, method: 'quantiles', bins: 5 },
          colors: this.categoryIdPalette
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [100, 100, 100, 255];
        getLineWidth = 1;
        getRadius = 4;
      } else if (g === 'Point' && v === 'String') {
        colorStyle = colorCategoriesStyle({
          categories: { stats, top: 10 },
          colors: 'Bold'
        });
        getFillColor = (d) => colorStyle(d.properties[propId]);
        getLineColor = [100, 100, 100, 255];
        getLineWidth = 1;
        getRadius = 4;
      }
    },
    resetColorStyle () {
      propId = undefined;
      colorStyle = undefined;
      getFillColor = undefined;
      getLineColor = undefined;
      getLineWidth = undefined;
      getRadius = undefined;
    },
    compare (a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.base-map {
  position: relative;
  height: 600px;
  font-family: $base__font-family;

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
    min-width: 240px;
    width: auto;
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
      color: $text__color--secondary;
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
