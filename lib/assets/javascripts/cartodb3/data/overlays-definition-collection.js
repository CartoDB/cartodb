var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.visId) throw new Error('visId is required');

    this._configModel = opts.configModel;
    this._visId = opts.visId;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('overlays');
    return baseUrl + '/api/' + version + '/viz/' + this._visId + '/overlays';
  },

  hasFetched: function () {
    return this.length > 0;
  },

  removeOverlay: function (type) {
    var overlay = this.findWhere({type: type});
    overlay && overlay.destroy();
  },

  createOverlay: function (type) {
    var types = {
      'fullscreen': this._createFullScreenOverlay,
      'layer_selector': this._createLayerSelectorOverlay,
      'search': this._createSearchOverlay,
      'zoom': this._createZoomOverlay,
      'logo': this._createLogoOverlay
    };
    var fn = types[type];
    fn && fn.call(this);
  },

  _createZoomOverlay: function () {
    var options = {
      type: 'zoom',
      order: 6,
      display: true,
      x: 20,
      y: 20
    };
    this.create(options);
  },

  _createLogoOverlay: function () {
    var options = {
      type: 'logo',
      order: 10,
      display: true,
      x: 10,
      y: 40
    };
    this.create(options);
  },

  _createSearchOverlay: function () {
    var options = {
      type: 'search',
      order: 3,
      display: true,
      x: 60,
      y: 20
    };
    this.create(options);
  },

  _createFullScreenOverlay: function () {
    var options = {
      type: 'fullscreen',
      order: 7,
      display: true,
      x: 20,
      y: 172
    };

    this.create(options);
  }
});
