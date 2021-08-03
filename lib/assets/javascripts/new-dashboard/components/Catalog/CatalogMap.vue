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

import { generateColorStyleProps, resetColorStyleProps } from './map-styles/colorStyles';
import { getQuantiles, formatNumber, capitalize, compare } from './map-styles/utils';

import ColorBinsLegend from './legends/ColorBinsLegend';
import ColorCategoriesLegend from './legends/ColorCategoriesLegend';

let deck;
let styleProps = {};

const BINS = 5;

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
      showMap: true,
      variable: null,
      geomType: null,
      initialViewState: {
        zoom: 1,
        latitude: 0,
        longitude: 0,
        bearing: 0,
        pitch: 0
      },
      centered: false
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      variables: state => state.catalog.variables,
      maps_api_v2_template: state => state.config && state.config.maps_api_v2_template,
      username: state => state.user && state.user.username
    }),
    title () {
      return this.dataset.name;
    },
    categoryId () {
      return this.dataset.category_id;
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
      return formatNumber(this.variable && this.variable.min);
    },
    variableMax () {
      return formatNumber(this.variable && this.variable.max);
    },
    variableAvg () {
      return formatNumber(this.variable && this.variable.avg);
    },
    variableBins () {
      if (this.variable && this.variable.quantiles && styleProps.colorStyle) {
        const breaks = [...getQuantiles(this.variable, BINS), this.variable.max];
        const bins = [...new Set(breaks)].map(q => ({
          color: `rgb(${styleProps.colorStyle(q)})`
        }));
        return bins;
      }
    },
    variableCategories () {
      if (this.variable && this.variable.categories && styleProps.colorStyle) {
        const categories = this.variable.categories.slice(0, 10).map(c => ({
          color: `rgb(${styleProps.colorStyle(c.category)})`,
          name: this.formatValue(c.category)
        }));
        categories.push({
          name: 'Others',
          color: 'rgb(165, 170, 153)'
        });
        return categories;
      }
    },
    tilesetSampleId () {
      const TILESET_SAMPLE_PROJECT_MAP = {
        ...(!this.isStaging && {
          'do-sample-prod': 'do-tileset-sample',
          'do-public-sample': 'do-public-tileset-sample'
        }),
        ...(this.isStaging && {
          'do-sample-prod': 'do-tileset-sample-stag',
          'do-public-sample': 'do-public-tileset-sample-stag'
        })
      };
      const [project, dataset, table] = this.dataset.sample_info.id.split('.');
      return [TILESET_SAMPLE_PROJECT_MAP[project], dataset, table].join('.');
    },
    mapUrl () {
      if (!this.maps_api_v2_template && this.isStaging) {
        return 'https://maps-api-v2.carto-staging.com/user/{user}';
      }
      return this.maps_api_v2_template;
    },
    isStaging () {
      return window.location.hostname.includes('staging');
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
      attributionControl: true
    });

    deck = new Deck({
      canvas: 'deck-canvas',
      initialViewState: this.initialViewState,
      onViewStateChange: ({ viewState }) => {
        this.syncMapboxViewState(viewState);
      },
      controller: true,
      getTooltip: this.getTooltip
    });

    this.renderLayer();
  },
  methods: {
    importMapboxStyles () {
      let style = document.createElement('link');
      style.type = 'text/css';
      style.rel = 'stylesheet';
      style.href = 'https://libs.cartocdn.com/mapbox-gl/v1.13.0/mapbox-gl.css';
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
            username: this.username || 'public',
            apiKey: 'default_public',
            ...(this.mapUrl && { mapsUrl: this.mapUrl })
          },
          ...styleProps.deck,
          lineWidthUnits: 'pixels',
          pointRadiusUnits: 'pixels',
          pickable: true,
          onDataLoad: (tileJSON) => {
            const { center, tilestats } = tileJSON;
            this.initialViewState = {
              // Zoom out the original zoom value
              zoom: parseFloat(center[2]) - 1,
              latitude: parseFloat(center[1]),
              longitude: parseFloat(center[0]),
              bearing: 0,
              pitch: 0
            };
            this.recenterMap();
            this.setGeomType(tilestats);
            this.setVariable(tilestats);
            this.setStyleProps();
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
    },
    setStyleProps () {
      styleProps = resetColorStyleProps();
      styleProps = generateColorStyleProps({
        geomType: this.geomType,
        variable: this.variable,
        categoryId: this.categoryId,
        isGeography: this.isGeography
      });
    },
    getTooltip ({ x, y, object }) {
      if (!object || !this.variable) return false;
      const title = this.variable.attribute;
      let html = `<p style="margin: 0 0 0 4px; color: #6f777c;">${title}</p>`;
      const objects = deck.pickMultipleObjects({ x, y })
        // Remove duplicated objects
        .filter((v, i, a) => a.findIndex(t => (t.index === v.index)) === i);
      let index = 0;
      const items = {};
      for (const o of objects) {
        if (compare(o.object.geometry.coordinates, object.geometry.coordinates)) {
          // Display the points that are fully overlapped (same coordinates)
          let value = o.object.properties[this.variable.attribute];
          value = this.formatValue(value);
          items[value] ? items[value].count += 1 : items[value] = { index: index++, count: 1 };
        }
      }
      const orderedItems = Object.keys(items).map(key => ({
        value: key, index: items[key].index, count: items[key].count
      })).sort((a, b) => (a.index > b.index) ? 1 : -1);
      for (const item of orderedItems) {
        let value = item.value;
        if (item.count > 1) {
          value += ` (${item.count})`;
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
    },
    formatValue (value) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number') {
          return formatNumber(value);
        }
        if (typeof value === 'string') {
          return capitalize(value);
        }
      }
      return 'No data';
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.base-map {
  position: relative;
  height: 600px;
  font-size: 12px;
  line-height: 20px;
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
