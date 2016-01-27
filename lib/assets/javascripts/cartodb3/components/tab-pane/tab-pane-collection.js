var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({

  model: cdb.core.Model,
  
  constructor: function(models, options) {
    options = _.extend(options || {}, { silent: false });
    Backbone.Collection.prototype.constructor.call(this, models, options);
  },

  initialize: function() {
    this.bind('reset', this._setSelected, this);
    this.bind('change:selected', this._onItemSelected, this);
    this._setSelected();
  },

  getSelected: function() {
    return this.find(function(model) {
      return model.get('selected');
    });
  },

  _setSelected: function() {
    var isSelected = this.getSelected();

    if (!isSelected && this.size() > 0) {
      this.at(0).set('selected', true)
    }
  },

  _onItemSelected: function(itemModel, isSelected) {
    if (!isSelected) {
      return;
    }

    this.each(function(model) {
      if (model.cid !== itemModel.cid) {
        model.set('selected', false);
      }
    }, this);
  }
});
