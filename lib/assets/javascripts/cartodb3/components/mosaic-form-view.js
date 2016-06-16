var CoreView = require('backbone/core-view');
var MosaicView = require('./mosaic/mosaic-view');

/**
 *  Mosaic form view
 */

module.exports = CoreView.extend({

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
    var mosaic = new MosaicView({
      collection: this.collection,
      modals: this._modals,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      userLayersCollection: this._userLayersCollection
    });

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(mosaic.render().el);
    this.addView(mosaic);
  },

  _onChangeHighlighted: function () {
    var selected = this.collection.getSelected();
    var highlighted = this.collection.getHighlighted();
    var $el = this.$('.js-highlight');

    if ($el && (highlighted || selected)) {
      $el.text((highlighted || selected).getName());
    }
  }

});
