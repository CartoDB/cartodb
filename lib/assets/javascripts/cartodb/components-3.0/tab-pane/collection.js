var Backbone = require('backbone');
var TabPaneModel = require('./model');

module.exports = Backbone.Collection.extend({

  model: TabPaneModel,

  initialize: function(options) {
    this.bind('add remove reset', this._setSelected, this);
  },

  _setSelected: function() {
    var isSelected = this.find(function(model) { 
      return model.get('selected');
    })

    if (!isSelected && this.size() > 0) {
      this.at(0).set('selected', true);
    }
  }
});
