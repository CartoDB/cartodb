var Backbone = require('backbone');
var _ = require('underscore');

var INPUT_TYPE_ORDER = ['color', 'image'];

module.exports = Backbone.Collection.extend({
  constructor: function (models, options) {
    options = _.extend(options || {}, { silent: false });
    Backbone.Collection.prototype.constructor.call(this, models, options);
  },

  comparator: function (model) {
    return INPUT_TYPE_ORDER.indexOf(model.get('type'));
  },

  initialize: function () {
    this.bind('change', this._onModelsChanged, this);
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

  _onModelsChanged: function (model) {
    var modelChanges = model.changed;

    if (_.isEmpty(modelChanges) || _.size(modelChanges) === 1 && model.changed.hasOwnProperty('selected')) {
      return;
    }

    this.trigger('onInputChanged', model);
  }
});
