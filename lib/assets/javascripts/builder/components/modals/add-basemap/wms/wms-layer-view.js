var CoreView = require('backbone/core-view');
var template = require('./wms-layer.tpl');

/**
 * View for an individual layer item.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'List-row',

  events: {
    'click .js-add': '_onClickAdd'
  },

  initialize: function (opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;
  },

  render: function () {
    this.$el.html(
      template({
        model: this.model,
        canSave: this.model.canSave(this._customBaselayersCollection)
      })
    );
    return this;
  },

  _onClickAdd: function (e) {
    this.killEvent(e);

    if (this.model.canSave(this._customBaselayersCollection)) {
      this.model.createProxiedLayerOrCustomBaselayerModel();
    }
  }

});
