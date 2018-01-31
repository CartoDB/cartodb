var Backbone = require('backbone');
var _ = require('underscore');

var INPUT_TYPE_ORDER = ['size', 'color'];

module.exports = Backbone.Collection.extend({
  constructor: function (models, options) {
    options = _.extend(options || {}, { silent: false });
    Backbone.Collection.prototype.constructor.call(this, models, options);
  },

  comparator: function (m) {
    return INPUT_TYPE_ORDER.indexOf(m.get('type'));
  },

  initialize: function () {
    this.bind('change:selected', this._onSelectedChange, this);
    this.bind('change', this._onModelsChanged, this);
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

  _onModelsChanged: function (mdl) {
    var mdlChanges = mdl.changed;

    // If there is any change about selected, don't propagate it
    if (_.isEmpty(mdlChanges) || (_.size(mdlChanges) === 1 && mdl.changed.hasOwnProperty('selected'))) {
      return;
    }

    this.trigger('inputChanged', mdl, this);
  },

  getValues: function () {
    return this.reduce(function (memo, mdl) {
      var data = {};
      var typeValues = mdl.toJSON();

      if (typeValues.fixed) {
        data.fixed = typeValues.fixed;

        if (typeValues.type === 'color') {
          if (typeValues.image) {
            data.image = typeValues.image;
          }
          if (typeValues.kind) {
            data.kind = typeValues.kind;
          }
          data.opacity = typeValues.opacity;
        }
      } else {
        data = _.omit(typeValues, ['createContentView', 'selected', 'type']);
      }

      memo[typeValues.type] = data;

      return memo;
    }, {});
  }
});
