var cdb = require('cartodb.js');
var BasemapHeaderView = require('./basemap-content-views/basemap-header-view');
var BasemapSourceView = require('./basemap-content-views/basemap-source-view');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var _ = require('underscore');
var Backbone = require('backbone');
var MosaicCollection = require('../../components/mosaic/mosaic-collection');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initCollections();
  },

  _initCollections: function () {
    this._basemapsCollection = new Backbone.Collection();

    _(this._layerDefinitionsCollection._basemaps).each(function (sourceLayers, source) {
      _.map(sourceLayers, function (m) {
        var tmpLayer = {
          default: m.default,
          urlTemplate: m.url,
          subdomains: m.subdomains,
          minZoom: m.minZoom,
          maxZoom: m.maxZoom,
          name: m.name,
          className: m.className,
          attribution: m.attribution,
          category: source,
          selected: this._baseLayer.get('urlTemplate') === m.url,
          val: m.className,
          label: m.name,
          template: function () {
            return m.className;
          }
        };

        // default basemaps are defined in app_config.yml
        this._basemapsCollection.add(tmpLayer);
      }, this);
    }, this);

    this._sourcesCollection = new CarouselCollection(
      _.map(this._getSources(), function (source) {
        return {
          selected: this._getCategory() === source,
          val: source,
          label: source,
          template: function () {
            return source;
          }
        };
      }, this)
    );

    this._sourcesCollection.bind('change:selected', this._renderSelect, this);
    this._baseLayer.bind('change', this._renderHeader, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    return this;
  },

  _getSources: function () {
    var sources = [];

    this._basemapsCollection.filter(function (mdl) {
      var s = mdl.get('category');

      if (!_.contains(sources, s)) {
        sources.push(s);
      }
    });

    return sources;
  },

  _getDefaultSource: function () {
    var defaultSource = this._basemapsCollection.find(function (basemapMdl) {
      return basemapMdl.get('default');
    }, this);

    return defaultSource.get('category');
  },

  _getSelectedSource: function () {
    var selectedSource = this._sourcesCollection.find(function (sourceMdl) {
      return sourceMdl.get('selected');
    }, this);

    return selectedSource.get('val');
  },

  _getCategory: function () {
    // baseLayer has no category at map creation
    var category = this._baseLayer.get('category') ? this._baseLayer.get('category') : this._getDefaultSource();

    return category;
  },

  _initViews: function () {
    this._renderHeader();

    var sourceView = new BasemapSourceView({
      sourcesCollection: this._sourcesCollection
    });
    this.addView(sourceView);
    this.$el.append(sourceView.render().el);

    this._renderSelect();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new BasemapHeaderView({
      model: this._layerDefinitionsCollection.getBaseLayer(),
      category: this._getCategory()
    });
    this.addView(this._headerView);
    this.$el.append(this._headerView.render().el);
  },

  _renderSelect: function () {
    if (this._selectView) {
      this.removeView(this._selectView);
      this._selectView.clean();
    }

    this._filteredBasemapsCollection = new MosaicCollection(
      _.map(this._getFilteredBasemaps(), function (basemap) {
        return {
          urlTemplate: basemap.get('urlTemplate'),
          selected: basemap.get('selected'),
          val: basemap.get('val'),
          label: basemap.get('label'),
          template: basemap.get('template')
        };
      }, this)
    );

    this._selectView = new BasemapSelectView({
      filteredBasemapsCollection: this._filteredBasemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(this._selectView);
    this.$el.append(this._selectView.render().el);
  },

  _getFilteredBasemaps: function () {
    var self = this;

    var filteredBasemaps = this._basemapsCollection.filter(function (mdl) {
      return mdl.get('category') === self._getSelectedSource();
    });

    return filteredBasemaps;
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
