var _ = require('underscore');
var Backbone = require('backbone');
var XYZView = require('./xyz-view');

/**
 * View model for XYZ tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'xyz',
    label: 'XYZ',
    tms: false,
    layer: undefined // will be set when valid
  },

  createView: function (opts) {
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;

    return new XYZView({
      model: this,
      submitButton: this._submitButton,
      modalFooter: this._modalFooter
    });
  },

  hasAlreadyAddedLayer: function (userLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(userLayers.isCustomCategory(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  }

});
