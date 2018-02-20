var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var FooterView = require('./footer/footer-view');
var ExportImageFormView = require('./export-image-form-view.js');
var ExportImageFormModel = require('./export-image-form-model');
var ExportImageWidget = require('./export-image-widget');
var template = require('./export-image-pane.tpl');
var Utils = require('builder/helpers/utils');
var Notifier = require('builder/components/notifier/notifier');
var browser = require('builder/helpers/browser-detect');

var Infobox = require('builder/components/infobox/infobox-factory');
var InfoboxView = require('builder/components/infobox/infobox-view');
var InfoboxModel = require('builder/components/infobox/infobox-model');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');

var DEFAULT_EXPORT_FORMAT = 'png';
var DEFAULT_EXPORT_WIDTH = 300;
var DEFAULT_EXPORT_HEIGHT = 200;

var CARTO_ATTRIBUTION = '@CARTO';
var ATTRIBUTION_WIDTH = 15;
var ATTRIBUTION_HEIGHT = 16;

var NOTIFICATION_ID = 'exportImageNotification';
var LOGO_PATH = '/unversioned/images/carto.png';

var GMAPS_DIMENSION_LIMIT = 640;
var GMAPS_DIMENSION_LIMIT_PREMIUM = 2048;

var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = [
  'canvasClassName',
  'configModel',
  'stackLayoutModel',
  'userModel',
  'visDefinitionModel',
  'stateDefinitionModel',
  'mapDefinitionModel',
  'editorModel',
  'settingsCollection'
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
      userModel: this._userModel,
      hasGoogleBasemap: this._hasGoogleMapsBasemap(),
      format: DEFAULT_EXPORT_FORMAT,
      x: x,
      y: y,
      width: width,
      height: height
    });
  },

  _isLogoActive: function () {
    var canRemoveLogo = this._userModel.get('actions').remove_logo;
    var logoSetting = this._settingsCollection.findWhere({
      setting: 'logo'
    });

    var isLogoActive = logoSetting && logoSetting.get('enabler') || false;
    if (!canRemoveLogo || canRemoveLogo && isLogoActive) {
      return true;
    }

    if (canRemoveLogo && !isLogoActive) {
      return false;
    }
  },

  _addErrorNotification: function (error) {
    Notifier.addNotification({
      id: NOTIFICATION_ID,
      status: 'error',
      closable: true,
      button: false,
      delay: Notifier.DEFAULT_DELAY,
      info: error + ' ' + _t('editor.maps.export-image.errors.try-again')
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(
      template({
        mapName: this._getMapName()
      })
    );

    this._createWidget();
    this._createForm();
    this._createDisclaimer();
    this._createFooter();

    return this;
  },

  _createForm: function () {
    this._exportImageFormView = new ExportImageFormView({
      formModel: this._exportImageFormModel,
      canvasModel: this._exportImageFormModel
    });

    this.$('.js-content').append(this._exportImageFormView.render().$el);
    this.addView(this._exportImageFormView);
  },

  _createDisclaimer: function () {
    var infoboxSstates = [{
      state: 'disclaimer',
      createContentView: function () {
        return Infobox.createWithAction({
          type: 'warning',
          title: _t('editor.maps.export-image.disclaimer.title'),
          body: _t('editor.maps.export-image.disclaimer.body')
        });
      }
    }];

    this._infoboxModel = new InfoboxModel({
      state: 'disclaimer'
    });

    this._infoboxCollection = new InfoboxCollection(infoboxSstates);

    this._infoboxView = new InfoboxView({
      infoboxModel: this._infoboxModel,
      infoboxCollection: this._infoboxCollection
    });

    this.$('.js-disclaimer').append(this._infoboxView.render().el);
    this.addView(this._infoboxView);
  },

  _createFooter: function () {
    this._footerView = new FooterView({
      configModel: this._configModel,
      userModel: this._userModel,
      formModel: this._exportImageFormModel
    });

    this.addView(this._footerView);
    this._footerView.bind('finish', this._exportImage, this);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _createWidget: function () {
    this._exportImageWidget = new ExportImageWidget({
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      model: this._exportImageFormModel,
      stateDefinitionModel: this._stateDefinitionModel,
      mapDefinitionModel: this._mapDefinitionModel
    });

    this.addView(this._exportImageWidget);
    this._$map.prepend(this._exportImageWidget.render().$el);
  },

  _getStaticMapURL: function () {
    var getStaticImageURL = this._mapDefinitionModel.getStaticImageURLTemplate();
    var imageMapMetadata = this._mapDefinitionModel.getImageExportMetadata();
    return getStaticImageURL({
      zoom: imageMapMetadata.zoom,
      width: this._exportImageFormModel.get('width'),
      height: this._exportImageFormModel.get('height'),
      lat: this._exportImageFormModel.get('lat'),
      lng: this._exportImageFormModel.get('lng'),
      format: 'png' // we always use 'png' to allow merging layers
    });
  },

  _removeNotification: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }
  },

  _exportImage: function () {
    var self = this;

    this._removeNotification();

    var def = $.Deferred();

    var logo = function () {
      return self._loadLogo();
    };

    var basemap = function () {
      if (self._hasGoogleMapsBasemap()) {
        return self._loadGMapBasemap();
      }
    };

    var image = function () {
      return self._onLoadImage(self._downloadImage.bind(self));
    };

    var attribution = function () {
      return self._loadAttribution();
    };

    def.then(logo)
      .then(basemap)
      .then(attribution)
      .then(image)
      .fail(this._onFail.bind(this));

    def.resolve();
  },

  _onFail: function (error) {
    this._footerView.stopLoader();
    this._addErrorNotification(error);
  },

  _getMapName: function () {
    return this._visDefinitionModel.get('name');
  },

  _downloadImage: function (canvas) {
    var browserInfo = browser();
    var imageFormat = this._exportImageFormModel.get('format');
    var fileName = this._getMapName() + '.' + imageFormat;

    if (canvas.msToBlob) {
      var image = canvas.msToBlob();
      window.navigator.msSaveBlob(
        new Blob([image], { type: 'image/' + imageFormat }), // eslint-disable-line
        fileName
      );
    } else {
      var dataUri = canvas.toDataURL('image/' + imageFormat);
      var link = document.createElement('a');
      document.body.appendChild(link);

      link.download = fileName;
      link.href = dataUri;

      if (browserInfo.name !== 'Safari') {
        link.target = '_blank';
      } else {
        dataUri.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
      }

      link.click();

      document.body.removeChild(link);
    }

    this._footerView.stopLoader();
  },

  _hasGoogleMapsBasemap: function () {
    var imageMapMetadata = this._mapDefinitionModel.getImageExportMetadata();
    return imageMapMetadata.provider === 'googlemaps';
  },

  _onLoadImage: function (callback) {
    var self = this;
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

      if (self._isLogoActive()) {
        self._drawLogo(ctx, width, height);
      }

      self._drawAttribution(ctx, width, height);

      callback(canvas);
    };

    image.onerror = function (e) {
      self._onFail(_t('editor.maps.export-image.errors.error-image'));
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

  _loadAttribution: function () {
    var self = this;
    var visMetadata = this._mapDefinitionModel.getImageExportMetadata();
    var deferred = $.Deferred();

    var image = new Image(); // eslint-disable-line
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var text = this._hasGoogleMapsBasemap() ? CARTO_ATTRIBUTION : Utils.stripHTML(visMetadata.attribution.join(' '));
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

    image.onerror = function () {
      deferred.reject(_t('editor.maps.export-image.errors.error-attribution'));
    };

    image.width = width;
    image.height = ATTRIBUTION_HEIGHT - 3;
    image.src = canvas.toDataURL();

    return deferred.promise();
  },

  _loadLogo: function () {
    var self = this;
    var deferred = $.Deferred();
    var logoUrl = this._configModel.get('app_assets_base_url') + LOGO_PATH;

    if (this._isLogoActive()) {
      this._getImageFromUrl(logoUrl)
        .then(function (image) {
          self._logo = image;
          deferred.resolve();
        })
        .fail(function () {
          deferred.reject(_t('editor.maps.export-image.errors.error-image'));
        });
    } else {
      deferred.resolve();
    }
    return deferred.promise();
  },

  _loadGMapBasemap: function () {
    var self = this;
    var apiUrl = self._configModel.get('base_url') + '/api/v1/viz/' + self._visDefinitionModel.get('id') + '/google_maps_static_image';
    var visMetadata = this._mapDefinitionModel.getImageExportMetadata();
    var deferred = $.Deferred();

    var onError = function () {
      deferred.reject(_t('editor.maps.export-image.errors.error-basemap'));
    };

    var onSuccess = function (data) {
      var limit = data.url.indexOf('signature') !== -1 ? GMAPS_DIMENSION_LIMIT_PREMIUM : GMAPS_DIMENSION_LIMIT;

      if (self._validGMapDimension(data.url, limit)) {
        self._getImageFromUrl(data.url)
          .then(function (image) {
            self._basemap = image;
            deferred.resolve();
          })
          .fail(onError);
      } else {
        deferred.reject(_t('editor.export-image.invalid-dimension', { limit: limit }));
      }
    };

    $.ajax({
      url: apiUrl,
      data: {
        center: this._getCenterString(),
        size: this._getDimensionString(),
        zoom: visMetadata.zoom
      },
      success: onSuccess,
      error: onError
    });

    return deferred.promise();
  },

  _getImageFromUrl: function (url) {
    var deferred = $.Deferred();
    var image = new Image(); // eslint-disable-line

    image.setAttribute('crossOrigin', 'anonymous');

    image.onload = function () {
      deferred.resolve(this);
    };

    image.onerror = function () {
      deferred.reject();
    };

    image.src = url;

    return deferred.promise();
  },

  _validGMapDimension: function (url, limit) {
    var width = this._exportImageFormModel.get('width');
    var height = this._exportImageFormModel.get('height');

    return width <= limit && height <= limit;
  },

  _goStepBack: function () {
    this._stackLayoutModel.prevStep();
  }
});
