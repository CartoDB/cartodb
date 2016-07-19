var BasemapMosaicView = require('./basemap-mosaic-view');
var BasemapMosaicModel = require('./basemap-mosaic-model');
var MosaicFormView = require('../../../components/mosaic-form-view');

/**
 *  Mosaic form view
 */

module.exports = MosaicFormView.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Mosaic collection is required');
    if (!opts.template) throw new Error('template is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this.template = opts.template;
    this._modals = opts.modals;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userLayersCollection = opts.userLayersCollection;
    this._currentTab = opts.currentTab;

    this._initBinds();
  },

  render: function () {
    var selectedItem = this.collection.getSelected();
    var selectedName = selectedItem && selectedItem.getName();
    this.$el.html(
      this.template({
        name: selectedName
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.collection.bind('change:highlighted', this._onChangeHighlighted, this);
  },

  _initViews: function () {
    this.mosaic = new BasemapMosaicView({
      model: new BasemapMosaicModel(),
      collection: this._userLayersCollection,
      modals: this._modals,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      userLayersCollection: this._userLayersCollection,
      currentTab: this._currentTab
    });
    this.mosaic.model.bind('change:highlightedAdd', this._onChangeHighlighted, this);

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(this.mosaic.render().el);
    this.addView(this.mosaic);
  },

  _onChangeHighlighted: function () {
    var selected = this.collection.getSelected();
    var highlighted = this.collection.getHighlighted() || this.mosaic.model.getHighlighted();
    var $el = this.$('.js-highlight');

    if ($el && (highlighted || selected)) {
      $el.text((highlighted || selected).getName());
    }
  }

});
