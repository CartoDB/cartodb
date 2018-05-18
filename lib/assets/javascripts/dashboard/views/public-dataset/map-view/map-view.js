const Backbone = require('backbone');
const $ = require('jquery');
const carto = require('@carto/carto.js');
const L = require('leaflet');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./map-view.tpl');
const { simple: styles } = require('builder/data/default-cartography.json');

const REQUIRED_OPTS = [
  'username',
  'serverUrl',
  'sqlUrl',
  'vizjson',
  'dataset'
];

module.exports = CoreView.extend({
  events: {
    'click .js-bounds': '_changeBounds'
  },

  className: 'map',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model();

    this.model.on('change:bounds', this._boundsClick, this);
  },

  _changeBounds: function () {
    this.model.set('bounds', !this.model.get('bounds'));
  },

  _boundsClick: function () {
    this.trigger('boundsChanged', { bounds: this.model.get('bounds') });
    this.$('.js-bounds .Checkbox-input').toggleClass('is-checked', !!this.model.get('bounds'));
  },

  render: function () {
    this.$el.html(template());
    const mapEl = this.$el.find('.carto-map')[0];
    this.map = L.map(mapEl).setView([0, 0], 0);

    this.map.on('zoomend moveend', () => {
      this.trigger('mapBoundsChanged', {
        bounds: this.map.getBounds(),
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      });
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(this.map);

    this.client = new carto.Client({
      apiKey: 'default_public',
      serverUrl: this._serverUrl,
      username: this._username
    });

    this.dataset = new carto.source.Dataset(this._dataset);
    const cartocss = new carto.style.CartoCSS('#layer {}');

    this.cartoLayer = new carto.layer.Layer(this.dataset, cartocss);

    this.client.addLayer(this.cartoLayer);

    this.client.getLeafletLayer().addTo(this.map);

    this._fetchBounds();

    return this;
  },

  enableMap: function () {
    this.map.invalidateSize();
  },

  setGeometry: function ([geom]) {
    let style;

    switch (geom) {
      case 'ST_Linestring':
        style = `#layer {
            line-color: ${styles.line.stroke.color.fixed};
            line-width: ${styles.line.stroke.size.fixed};
            line-opacity: ${styles.line.stroke.color.opacity};
          }
        `;
        break;
      case 'ST_Point':
        style = `#layer {
          marker-width: ${styles.point.fill.size.fixed};
          marker-fill: ${styles.point.fill.color.fixed};
          marker-fill-opacity: ${styles.point.fill.color.opacity};
          marker-line-color: ${styles.point.stroke.color.fixed};
          marker-line-width: ${styles.point.stroke.size.fixed};
          marker-line-opacity: ${styles.point.stroke.color.opacity};
          marker-placement: point;
          marker-type: ellipse;
          marker-allow-overlap: true;
        }`;
        break;
      case 'ST_Polygon':
        style = `#layer {
          polygon-fill: ${styles.polygon.fill.color.fixed};
          polygon-opacity: ${styles.polygon.fill.color.opacity};
          ::outline {
            line-color: ${styles.polygon.stroke.color.fixed};
            line-width: ${styles.polygon.stroke.size.fixed};
            line-opacity: ${styles.polygon.stroke.color.opacity};
          }
        }`;
        break;
      default:
        style = `#layer {}`;
        break;
    }

    this.cartoLayer.setStyle(new carto.style.CartoCSS(style));
  },

  _fetchBounds: function () {
    $.ajax({
      type: 'GET',
      data: 'q=' + encodeURIComponent(`SELECT ST_Extent(the_geom) as extent FROM ${this._dataset}`) + '&api_key=default_public',
      url: this._sqlUrl,
      success: (data) => {
        const bounds = data.rows[0].extent;
        const parsedBounds = /BOX\((.+) (.+),(.+) (.+)\)/.exec(bounds)
          .splice(1, 4)
          .map(e => parseFloat(e));
        this.map.fitBounds([
          [parsedBounds[1], parsedBounds[0]], [parsedBounds[3], parsedBounds[2]]
        ]);
      },
      error: () => {}
    });
  },

  invalidateMap: function () {
    this.map.invalidateSize();
  }
});
