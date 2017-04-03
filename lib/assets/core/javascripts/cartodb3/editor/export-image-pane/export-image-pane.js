var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var FooterView = require('./footer/footer-view');
var ExportImageFormView = require('./export-image-form-view.js');
var ExportImageFormModel = require('./export-image-form-model');
var ExportImageWidget = require('./export-image-widget');
var template = require('./export-image-pane.tpl');
var Utils = require('../../helpers/utils');

var DEFAULT_EXPORT_FORMAT = 'png';
var DEFAULT_EXPORT_WIDTH = 300;
var DEFAULT_EXPORT_HEIGHT = 200;

var CARTO_ATTRIBUTION = '@CARTO';
var ATTRIBUTION_WIDTH = 15;
var ATTRIBUTION_HEIGHT = 16;

var GMAPS_STATIC_MAP_ENDPOINT = 'https://maps.googleapis.com/maps/api/staticmap';

var checkAndBuildOpts = require('../../helpers/required-opts');
var REQUIRED_OPTS = [
  'visDefinitionModel',
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

    this._mapView = mapView; // eslint-disable-line
    this._vis = vis; // eslint-disable-line

    this._canvasModel = new Backbone.Model();
    this._$map = $('.' + this._canvasClassName);

    var width = DEFAULT_EXPORT_WIDTH;
    var height = DEFAULT_EXPORT_HEIGHT;

    var x = Math.ceil(this._$map.width() / 2 - (width / 2));
    var y = Math.ceil(this._$map.height() / 2 - (height / 2));

    this._exportImageFormModel = new ExportImageFormModel({
      userModel: this._userModel,
      hasGoogleBasemap: this._hasGoogleMapsBasemap(),
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
      self._loadLogo();
    }).then(function () {
      self._loadAttribution();
    }).then(function () {
      if (self._hasGoogleMapsBasemap()) {
        return self._loadImage(self._getGMapBasemapURL());
      }
    }).then(function () {
      return self._onLoadImage(self._downloadImage.bind(self));
    });

    def.resolve();
  },

  _downloadImage: function (dataUri) {
    var format = this._exportImageFormModel.get('format');

    var link = document.createElement('a');
    document.body.appendChild(link);

    link.download = this._visDefinitionModel.get('name') + '.' + format;
    link.href = dataUri;
    link.target = '_blank';
    link.click();
    this._footerView.stop();
    document.body.removeChild(link);
  },

  _hasGoogleMapsBasemap: function () {
    return this._vis.map.get('provider') === 'googlemaps';
  },

  _onLoadImage: function (callback) {
    var self = this;

    var format = this._exportImageFormModel.get('format');
    var url = this._getStaticMapURL();

    var basemap = this._basemap;

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

      ctx.drawImage(this, 0, 0);

      self._drawLogo(ctx, width, height);
      self._drawAttribution(ctx, width, height);

      var extension = 'image/' + format;
      callback(canvas.toDataURL(extension));
    };

    image.src = url;
  },

  _drawLogo: function (ctx, width, height) {
    if (this._logo) {
      var left = (width / 2) - (this._logo.width / 2);
      var top = height - this._logo.height - 5;

      ctx.drawImage(this._logo, left, top);
    }
  },

  _drawAttribution: function (ctx, width, height) {
    if (this._attribution) {
      var left = width - this._attribution.width - 3;
      var top = height - this._attribution.height;

      if (this._hasGoogleMapsBasemap()) {
        var attributionWidth = this._$map.find('.gm-style-cc').width();

        if (attributionWidth >= width / 2) {
          top = top - ATTRIBUTION_HEIGHT / 2;
        }

        top = height - this._attribution.height - ATTRIBUTION_HEIGHT;
      }

      ctx.drawImage(this._attribution, left, top);
    }
  },

  _getDimensionString: function () {
    var width = this._exportImageFormModel.get('width');
    var height = this._exportImageFormModel.get('height');

    return width + 'x' + height;
  },

  _getCenterString: function () {
    var lat = +this._exportImageFormModel.get('lat').toFixed(6);
    var lng = +this._exportImageFormModel.get('lng').toFixed(6);

    return lat + ',' + lng;
  },

  _getGMapBasemapURL: function () {
    var params = {
      center: this._getCenterString().replace(',', ';'), // we'll replace it below with a comma
      zoom: this._vis.map.getZoom(),
      size: this._getDimensionString(),
      mapType: this._vis.map.getBaseLayer().get('baseType'),
      rnd: Math.random(1000)
    };

    var flattenedParams = _.pairs(params).join('&').replace(/,/g, '=').replace(/;/g, ',');
    var style = this._getStaticStyles(this._vis.getLayers()[0].get('style'));
    var key = this._userModel.get('google_maps_key');

    return GMAPS_STATIC_MAP_ENDPOINT + '?' + flattenedParams + '&style=' + style + '&' + key;
  },

  _loadAttribution: function () {
    var self = this;

    var deferred = $.Deferred();

    var image = new Image(); // eslint-disable-line
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var text = this._hasGoogleMapsBasemap() ? CARTO_ATTRIBUTION : Utils.stripHTML(this._vis.map.get('attribution').join(' '));
    var dimension = ctx.measureText(text);
    var width = dimension.width;

    ctx.font = '11px';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-ATTRIBUTION_WIDTH, 0, width + ATTRIBUTION_WIDTH + 2, ATTRIBUTION_HEIGHT - 3);

    ctx.fillStyle = '#333';
    ctx.fillText(text, 0, 10);

    image.onload = function () {
      self._attribution = this;
      deferred.resolve();
    };

    image.width = width;
    image.height = ATTRIBUTION_HEIGHT - 3;
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
