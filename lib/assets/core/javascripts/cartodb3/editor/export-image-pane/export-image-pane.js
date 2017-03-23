var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Header = require('./export-image-header');
var FooterView = require('./footer/footer-view');
var ExportImageFormView = require('./export-image-form-view.js');
var ExportImageFormModel = require('./export-image-form-model');
var ExportImageWidget = require('./export-image-widget');
var template = require('./export-image-pane.tpl');

var DEFAULT_EXPORT_FORMAT = 'png';
var DEFAULT_EXPORT_WIDTH = 300;
var DEFAULT_EXPORT_HEIGHT = 200;

var GMAPS_STATIC_MAP_ENDPOINT = 'https://maps.googleapis.com/maps/api/staticmap';

var checkAndBuildOpts = require('../../helpers/required-opts');
var REQUIRED_OPTS = [
  'canvasClassName',
  'modals',
  'configModel',
  'userModel',
  'editorModel',
  'privacyCollection',
  'widgetDefinitionsCollection',
  'mapcapsCollection',
  'visDefinitionModel',
  'mapStackLayoutModel',
  'stateDefinitionModel',
  'stackLayoutModel'
];

module.exports = CoreView.extend({
  className: 'Editor-content',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._mapView = mapView; // eslint-disable-line
    this._vis = vis; // eslint-disable-line

    this._canvasModel = new Backbone.Model();
    this._$map = $('.' + this._canvasClassName);

    var width = DEFAULT_EXPORT_WIDTH;
    var height = DEFAULT_EXPORT_HEIGHT;

    var x = Math.ceil(this._$map.width() / 2 - (width / 2));
    var y = Math.ceil(this._$map.height() / 2 - (height / 2));

    this._exportImageFormModel = new ExportImageFormModel({
      vis: this._vis,
      format: DEFAULT_EXPORT_FORMAT,
      x: x,
      y: y,
      width: width,
      height: height
    });

    this._exportImageWidget = new ExportImageWidget({
      mapView: this._mapView,
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      model: this._exportImageFormModel
    });

    this.addView(this._exportImageWidget);
  },

  render: function () {
    this.$el.append(template);

    this._$map.prepend(this._exportImageWidget.render().$el);

    this._createHeader();
    this._createForm();
    this._createFooter();

    return this;
  },

  _createHeader: function () {
    var self = this;

    var header = new Header({
      editorModel: self._editorModel,
      mapcapsCollection: self._mapcapsCollection,
      modals: self._modals,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      configModel: self._configModel,
      userModel: self._userModel
    });

    header.bind('back', function () {
      this._stackLayoutModel.prevStep();
    }, this);

    this.$('.js-content').append(header.render().$el);
    this.addView(header);
  },

  _createForm: function () {
    var exportImageFormView = new ExportImageFormView({
      formModel: this._exportImageFormModel,
      canvasModel: this._exportImageFormModel
    });

    this.$('.js-content').append(exportImageFormView.render().$el);
    this.addView(exportImageFormView);
  },

  _createFooter: function () {
    this._footerView = new FooterView({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this.addView(this._footerView);
    this._footerView.bind('finish', this._exportImage, this);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _getStaticMapURL: function () {
    return this._vis.getStaticImageURL({
      zoom: this._vis.map.getZoom(),
      width: this._exportImageFormModel.get('width'),
      height: this._exportImageFormModel.get('height'),
      lat: this._exportImageFormModel.get('lat'),
      lng: this._exportImageFormModel.get('lng'),
      format: 'png' // we always use 'png' to allow merging layers
    });
  },

  _getStaticStyles: function (styles) {
    if (!styles) {
      return;
    }

    styles = JSON.parse(styles);

    var result = [];

    styles.forEach(function (v, i, a) {
      var style = '';

      if (v.stylers) { // only if there is a styler object
        if (v.stylers.length > 0) { // Needs to have a style rule to be valid.
          style += (v.hasOwnProperty('featureType') ? 'feature:' + v.featureType : 'feature:all') + '|';
          style += (v.hasOwnProperty('elementType') ? 'element:' + v.elementType : 'element:all') + '|';

          v.stylers.forEach(function (val, i, a) {
            var propertyname = Object.keys(val)[0];
            var propertyval = val[propertyname].toString().replace('#', '0x');
            // changed "new String()" based on: http://stackoverflow.com/a/5821991/1121532

            style += propertyname + ':' + propertyval + '|';
          });
        }
      }
      result.push('style=' + encodeURIComponent(style));
    });

    return result.join('&');
  },

  _exportImage: function () {
    var self = this;
    var format = this._exportImageFormModel.get('format');
    var url = this._getStaticMapURL();

    var load = function (basemap) {
      self._onLoadImage(url, format, basemap, self._downloadImage.bind(self));
    };

    if (this._hasGoogleMapsBasemap()) {
      this._loadImage(this._getGMapBasemapURL(), load);
    } else {
      load();
    }
  },

  _downloadImage: function (dataUri) {
    var format = this._exportImageFormModel.get('format');

    var link = document.createElement('a');
    link.download = this._vis.get('title') + '.' + format;
    link.href = dataUri;
    link.click();
    this._footerView.stop();
  },

  _hasGoogleMapsBasemap: function () {
    return this._vis.map.get('provider') === 'googlemaps';
  },

  _onLoadImage: function (url, format, basemap, callback) {
    var image = new Image(); // eslint-disable-line

    image.setAttribute('crossOrigin', 'anonymous');

    image.onload = function () {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      if (basemap) {
        ctx.drawImage(basemap, 0, 0);
      }

      ctx.drawImage(this, 0, 0);

      var extension = 'image/' + format;
      callback(canvas.toDataURL(extension));
    };

    image.src = url;
  },

  _getGMapBasemapURL: function () {
    var width = this._exportImageFormModel.get('width');
    var height = this._exportImageFormModel.get('height');
    var lat = +this._exportImageFormModel.get('lat').toFixed(3);
    var lng = +this._exportImageFormModel.get('lng').toFixed(3);

    var size = width + 'x' + height;
    var center = lat + ';' + lng; // we'll replace it later with a comm comma

    var style = this._getStaticStyles(this._vis.getLayers()[0].get('style'));

    var params = {
      key: this._configModel.get('google_maps_key'),
      center: center,
      zoom: this._vis.map.getZoom(),
      size: size,
      style: style,
      mapType: this._vis.map.getBaseLayer().get('baseType'),
      rnd: Math.random(1000)
    };

    return GMAPS_STATIC_MAP_ENDPOINT + '?' + _.pairs(params).join('&').replace(/,/g, '=').replace(/;/g, ',');
  },

  _loadImage: function (url, onLoad) {
    var image = new Image(); // eslint-disable-line

    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = function () {
      onLoad(this);
    };
    image.src = url;
  }
});
