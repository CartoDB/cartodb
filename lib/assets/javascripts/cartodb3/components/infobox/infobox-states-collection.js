var Backbone = require('backbone');
var InfoboxStateModel = require('./infobox-state-model');
var _ = require('underscore');

/*
 *  Infobox states collection
 */

module.exports = Backbone.Collection.extend({

  model: InfoboxStateModel,

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
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
    if (!selected) {
      selected = _.first(this.models);
    }

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

    this.trigger('change:state');
    return selectedModel;
  }

});
