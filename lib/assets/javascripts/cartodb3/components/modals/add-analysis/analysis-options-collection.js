var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    this.on('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m !== changedModel) {
          m.set('selected', false);
        }
      });
    }
  }

});
