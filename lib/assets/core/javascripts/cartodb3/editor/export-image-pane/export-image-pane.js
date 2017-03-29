var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
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
  'mapView',
  'vis',
  'canvasClassName',
  'configModel',
  'stackLayoutModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Editor-content',

  events: {
    'click .js-back': '_goStepBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._canvasModel = new Backbone.Model();
    this._$map = $('.' + this._canvasClassName);

    var width = DEFAULT_EXPORT_WIDTH;
    var height = DEFAULT_EXPORT_HEIGHT;

    var x = Math.ceil(this._$map.width() / 2 - (width / 2));
    var y = Math.ceil(this._$map.height() / 2 - (height / 2));

    this._exportImageFormModel = new ExportImageFormModel({
      hasGoogleBasemap: this._vis.map.get('provider') === 'googlemaps',
      format: DEFAULT_EXPORT_FORMAT,
      x: x,
      y: y,
      width: width,
      height: height
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(
      template({
        title: _t('editor.maps.export-image.title')
      })
    );

    this._createWidget();
    this._createForm();
    this._createFooter();

    return this;
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

  _createWidget: function () {
    this._exportImageWidget = new ExportImageWidget({
      mapView: this._mapView,
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      model: this._exportImageFormModel
    });

    this.addView(this._exportImageWidget);
    this._$map.prepend(this._exportImageWidget.render().$el);
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

    var result = [];
    var propertyname;
    var propertyval;
    var style = '';

    JSON.parse(styles).forEach(function (s) {
      style = '';
      if (s.stylers && s.stylers.length > 0) {
        style += (s.hasOwnProperty('featureType') ? 'feature:' + s.featureType : 'feature:all') + '|';
        style += (s.hasOwnProperty('elementType') ? 'element:' + s.elementType : 'element:all') + '|';

        s.stylers.forEach(function (val) {
          propertyname = Object.keys(val)[0];
          propertyval = val[propertyname].toString().replace('#', '0x');
          style += propertyname + ':' + propertyval + '|';
        });
      }

      if (style) {
        result.push('style=' + style);
      }
    });

    return result.join('&');
  },

  _exportImage: function () {
    var self = this;

    var def = $.Deferred();

    def.then(function () {
      return self._loadLogo();
    }).then(function () {
      return self._loadAttribution();
    }).then(function () {
      if (self._hasGoogleMapsBasemap()) {
        return self._loadImage(self._getGMapBasemapURL());
      }
    }).then(function () {
      self._onLoadImage(self._downloadImage.bind(self));
    });

    def.resolve();
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

  _onLoadImage: function (callback) {
    var format = this._exportImageFormModel.get('format');
    var url = this._getStaticMapURL();

    var logo = this._logo;
    var basemap = this._basemap;
    var attribution = this._attribution;

    var width = +this._exportImageFormModel.get('width');
    var height = +this._exportImageFormModel.get('height');

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

      if (logo) {
        ctx.drawImage(logo, (width / 2) - (logo.width / 2), height - logo.height - 5);
      }

      if (attribution) {
        ctx.drawImage(attribution, width - attribution.width - 3, height - attribution.height - 16);
      }

      ctx.drawImage(this, 0, 0);

      var extension = 'image/' + format;
      callback(canvas.toDataURL(extension));
    };

    image.src = url;
  },

  _getDimensionString: function () {
    var width = this._exportImageFormModel.get('width');
    var height = this._exportImageFormModel.get('height');

    return width + 'x' + height;
  },

  _getCenterString: function () {
    var lat = +this._exportImageFormModel.get('lat').toFixed(3);
    var lng = +this._exportImageFormModel.get('lng').toFixed(3);

    return lat + ',' + lng;
  },

  _getGMapBasemapURL: function () {
    var params = {
      key: this._userModel.get('google_maps_key'),
      center: this._getCenterString().replace(',', ';'), // we'll replace it below with a comma
      zoom: this._vis.map.getZoom(),
      size: this._getDimensionString(),
      style: this._getStaticStyles(this._vis.getLayers()[0].get('style')),
      mapType: this._vis.map.getBaseLayer().get('baseType'),
      rnd: Math.random(1000)
    };

    return GMAPS_STATIC_MAP_ENDPOINT + '?' + _.pairs(params).join('&').replace(/,/g, '= ').replace(/;/g, ',');
  },

  _loadAttribution: function () {
    var self = this;

    var deferred = $.Deferred();

    var image = new Image(); // eslint-disable-line
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var text = '@CARTO';
    var d = ctx.measureText(text);
    var w = d.width;

    ctx.font = '11px';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-15, 0, w + 17, 13);

    ctx.fillStyle = '#333';
    ctx.fillText(text, 0, 10);

    image.onload = function () {
      self._attribution = this;
      deferred.resolve();
    };

    image.width = w;
    image.height = 13;
    image.src = canvas.toDataURL();

    return deferred.promise();
  },

  _loadLogo: function () {
    var self = this;

    var image = new Image(); // eslint-disable-line
    var data = this._$map.find('.CDB-Logo').html();
    var DOMURL = window.URL || window.webkitURL || window; // eslint-disable-line
    var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' }); // eslint-disable-line
    var deferred = $.Deferred();
    var url = DOMURL.createObjectURL(svg);

    image.onload = function () {
      self._logo = this;
      DOMURL.revokeObjectURL(url);
      deferred.resolve();
    };

    image.src = url;

    return deferred.promise();
  },

  _loadImage: function (url) {
    var self = this;
    var deferred = $.Deferred();
    var image = new Image(); // eslint-disable-line

    image.setAttribute('crossOrigin', 'anonymous');

    image.onload = function () {
      self._basemap = this;
      deferred.resolve();
    };

    image.src = url;
    return deferred.promise();
  },

  _goStepBack: function () {
    this._stackLayoutModel.prevStep();
  }
});
