var cdb = require('cartodb.js');
var BasemapHeader = require('./basemap-header-view.js');
var BasemapSourceView = require('./basemap-content-views/basemap-source-view');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var _ = require('underscore');
var Backbone = require('backbone');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._stackLayoutModel = opts.stackLayoutModel;

    this._initCollections();
  },

  _initCollections: function () {
    this._basemapsCollection = new Backbone.Collection();

    _(this._layerDefinitionsCollection._basemaps).each(function (sourceLayers, source) {
      _.map(sourceLayers, function (m) {
        var tmpLayer = {
          urlTemplate: m.url,
          subdomains: m.subdomains,
          minZoom: m.minZoom,
          maxZoom: m.maxZoom,
          name: m.name,
          className: m.className,
          attribution: m.attribution,
          source: source,
          selected: this._layerDefinitionsCollection.getBaseLayer().get('url') === m.url,
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
          selected: this._getDefaultBasemap().get('source') === source,
          val: source,
          label: source,
          template: function () {
            return source;
          }
        };
      }, this)
    );

    this._sourcesCollection.bind('change:selected', this._renderBasemapSelect, this);
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
      var s = mdl.get('source');

      if (!_.contains(sources, s)) {
        sources.push(s);
      }
    });

    return sources;
  },

  _getSelectedSource: function () {
    var selectedSource = this._sourcesCollection.find(function (mdl) {
      return mdl.get('selected');
    }, this);

    return selectedSource.get('label');
  },

  _getDefaultBasemap: function () {
    var defaultBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('selected');
    }, this);

    return defaultBasemap;
  },

  _initViews: function () {
    var header = new BasemapHeader({
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.addView(header);
    this.$el.append(header.render().$el);

    var sourceView = new BasemapSourceView({
      basemapsCollection: this._basemapsCollection,
      sourcesCollection: this._sourcesCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(sourceView);
    this.$el.append(sourceView.render().el);

    this._renderBasemapSelect();
  },

  _renderBasemapSelect: function () {
    if (this._BasemapSelectView) {
      this.removeView(this._BasemapSelectView);
      this._BasemapSelectView.clean();
    }

    this._BasemapSelectView = new BasemapSelectView({
      basemapsCollection: this._basemapsCollection,
      selectedSource: this._getSelectedSource(),
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(this._BasemapSelectView);
    this.$el.append(this._BasemapSelectView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
