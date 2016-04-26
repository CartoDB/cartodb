var Backbone = require('backbone');
var cdb = require('cartodb.js');
var CustomListItemModel = require('./custom-list-item-model');
var _ = require('underscore');

/*
 *  Custom list collection, it parses pairs like:
 *
 *  [{ val, label }]
 *  ["string"]
 */

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    var d = {};
    if (typeof attrs === 'string') {
      d.val = attrs;
    } else {
      d = attrs;
    }
    return new CustomListItemModel(d);
  },

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  search: function (query) {
    if (query === '') return this;

    var pattern = new RegExp(query, 'gi');
    return _(this.filter(function (data) {
      return pattern.test(data.getName());
    }));
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid) {
          m.set({
            selected: false
          }, {
            silent: true
          });
        }
      });
    }
  },

  getSelectedItem: function () {
    return _.first(
      this.where({ selected: true })
    );
  },

  setSelected: function (value) {
    var selectedModel;
    var silentTrue = { silent: true };
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
    return selectedModel;
  }

});
