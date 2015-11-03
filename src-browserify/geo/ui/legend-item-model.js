var Model = require('../../core/model');

var LegendItemModel = Model.extend({

  defaults: {
    name: "Untitled",
    visible:true,
    value: ""
  }

});

module.exports = LegendItemModel;
