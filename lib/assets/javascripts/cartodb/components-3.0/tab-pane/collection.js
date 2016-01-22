var Backbone = require('backbone');
var TabPaneModel = require('./model');

module.exports = Backbone.Collection.extend({

  model: TabPaneModel,

  initialize: function(options) {

  },

  setSelected: function() {
    var isSelected = this.find(function(model) { 
      return model.get('selected');
    })

    if (!isSelected && this.length > 0) {
      this.at(0).set('selected', true);
    }
  }
});
