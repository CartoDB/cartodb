var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({
  constructor: function (models, options) {
    options = _.extend(options || {}, { silent: false });
    Backbone.Collection.prototype.constructor.call(this, models, options);
  },

  initialize: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  getSelected: function () {
    return this.find(function (model) {
      return model.get('selected');
    });
  },

  unselect: function () {
    this.each(function (model) {
      model.set('selected', false);
    }, this);
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

  getValues: function () {
    return this.reduce(function (memo, mdl) {
      var data = {};
      var typeValues = mdl.toJSON();

      if (typeValues.fixed) {
        data = {
          fixed: typeValues.fixed
        };
      } else {
        data = _.omit(typeValues, ['createContentView', 'selected', 'type']);
      }

      memo[typeValues.type] = data;

      return memo;
    }, {});
  }
});
