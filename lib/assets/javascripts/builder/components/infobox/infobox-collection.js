var Backbone = require('backbone');
var InfoboxModel = require('./infobox-item-model');
var _ = require('underscore');

/*
 *  Infobox states collection
 */

module.exports = Backbone.Collection.extend({
  model: InfoboxModel,

  initialize: function () {
    this._initBinds();
  },

  reset: function (models, options) {
    this._defaultSelected(models);
    Backbone.Collection.prototype.reset.call(this, models, options);
  },

  _initBinds: function () {
    this.on('change:selected', this._onSelectedChange, this);
    this.on('reset', this._defaultSelected, this);
  },

  _defaultSelected: function (models) {
    var selected = _.first(_.where(models, {selected: true}));
    if (!selected) {
      selected = _.first(models);
      if (this._isModel(selected)) {
        selected.set({selected: true}, {silent: true});
      } else {
        selected.selected = true;
      }
    }
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid) {
          m.set({selected: false}, {silent: true});
        }
      });
    }
  },

  getState: function (state) {
    return _.first(this.where({state: state}));
  },

  getSelected: function () {
    var selected;
    selected = _.first(this.where({selected: true}));
    return selected;
  },

  setSelected: function (state) {
    var selectedModel;

    this.each(function (mdl) {
      if (mdl.get('state') === state) {
        mdl.set({selected: true}, {silent: true});
        selectedModel = mdl;
      } else {
        mdl.set({selected: false}, {silent: true});
      }
    });

    return selectedModel;
  }

});
