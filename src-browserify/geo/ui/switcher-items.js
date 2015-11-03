var Backbone = require('backbone');
var SwitcherItemModel = require('./switcher-item-model');

var SwitcherItems = Backbone.Collection.extend({
  model: SwitcherItemModel
});

module.exports = SwitcherItems;
