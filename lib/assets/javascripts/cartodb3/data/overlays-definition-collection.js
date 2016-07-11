var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.visId) throw new Error('visId is required');
    if (!opts.syncCollection) throw new Error('syncCollection is required');

    this._configModel = opts.configModel;
    this._visId = opts.visId;
    this._overlaysCollection = opts.syncCollection;

    this._initBinds();
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('overlays');
    return baseUrl + '/api/' + version + '/viz/' + this._visId + '/overlays';
  },

  _initBinds: function () {
    this.on('add', this._addSync, this);
    this.on('remove', this._removeSync, this);
  },

  _addSync: function (m) {
    this._overlaysCollection.add(m.toJSON());
  },

  hasFetched: function () {
    return this.length > 0;
  },

  _removeSync: function (m) {
    var overlay = this._overlaysCollection.findWhere({type: m.get('type')});
    overlay && this._overlaysCollection.remove(overlay);
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

  _createLayerSelectorOverlay: function () {
    var options = {
      type: 'layer_selector',
      order: 4,
      display: true,
      x: 212,
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
