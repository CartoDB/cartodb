var _ = require('underscore');
var CustomListCollection = require('./custom-list-collection');

module.exports = CustomListCollection.extend({
  _initBinds: function () { },

  setSelected: function (value) {
    var selectedModel;
    var silentTrue = { silent: true };

    if (_.isArray(value)) {
      this.each(function (mdl) {
        if (_.contains(value, mdl.getValue())) {
          mdl.set({
            selected: true
          }, silentTrue);
          selectedModel = mdl;
        } else {
          mdl.set({
            selected: false
          }, silentTrue);
        }
      });
    } else {
      this.each(function (mdl) {
        if (mdl.getValue() === value) {
          mdl.set({
            selected: true
          }, silentTrue);
          selectedModel = mdl;
        } else {
          mdl.set({
            selected: false
          }, silentTrue);
        }
      });
    }
    return selectedModel;
  }
});
