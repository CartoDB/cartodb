var Backbone = require('backbone');
var TabPaneModel = require('./model');

module.exports = Backbone.Collection.extend({

  model: TabPaneModel,

  initialize: function(options) {
    this.bind('add remove reset', this._setSelected, this);
    this.bind('change:selected', this._onItemSelected, this);
  },

  _setSelected: function() {
    var isSelected = this.find(function(model) { 
      return model.get('selected');
    })

    if (!isSelected && this.size() > 0) {
      this.at(0).set('selected', true);
    }
  },

  _onItemSelected: function(itemModel) {
    this.each(function(model) {
      if (model !== itemModel) {
        model.set('selected', false);
      }
    });
  }
});
