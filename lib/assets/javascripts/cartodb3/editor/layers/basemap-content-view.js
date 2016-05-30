var cdb = require('cartodb.js');
var BasemapHeader = require('./basemap-header-view.js');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var BasemapSelectView = require('./basemap-content-views/basemap-select-view');
var _ = require('underscore');

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

    this._initCollection();
  },

  _initCollection: function () {
    this._basemapsCollection = new CarouselCollection(
      _.map(this._layerDefinitionsCollection._basemaps.CartoDB, function (basemap, index) {
        return {
          default: basemap.default,
          selected: false,
          val: index,
          label: basemap.name,
          urlTemplate: basemap.urlTemplate,
          template: function () {
            return index;
          }
        };
      }, this)
    );
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    return this;
  },

  _initViews: function () {
    var header = new BasemapHeader({
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.addView(header);
    this.$el.append(header.render().$el);

    var selectView = new BasemapSelectView({
      basemapsCollection: this._basemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(selectView);
    this.$el.append(selectView.render().el);
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep('layers');
  }

});
