var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({
  constructor: function (models, options) {
    options = _.extend(options || {}, { silent: false });
    Backbone.Collection.prototype.constructor.call(this, models, options);
  },

  initialize: function () {
    this.bind('reset', this._setSelected, this);
    this.bind('change:selected', this._onSelectedChange, this);
    this._setSelected();
  },

  getSelected: function () {
    return this.find(function (model) {
      return model.get('selected');
    });
  },

  _setSelected: function () {
    var isSelected = this.getSelected();

    if (!isSelected && this.size() > 0) {
      this.at(0).set('selected', true);
    }
  },

  _onSelectedChange: function (itemModel, isSelected) {
    if (!isSelected) {
      return;
    }

    this.each(function (model) {
      if (model !== itemModel) {
        model.set('selected', false);
      }
    }, this);
  },

  select: function (name, value) {
    var model = this.find(function (m) {
      return m.get(name) === value;
    }, this);

    if (model) {
      model.set('selected', true);
    }
  }
});
