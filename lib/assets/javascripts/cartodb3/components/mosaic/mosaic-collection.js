var Backbone = require('backbone');
var MosaicModel = require('./mosaic-item-model');
var _ = require('underscore');

/*
 *  List collection, it parses pairs like:
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
    return new MosaicModel(d);
  },

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid && m.get('selected')) {
          m.set('selected', false);
        }
      });
    }
  },

  getSelected: function () {
    return _.first(this.where({ selected: true }));
  },

  getHighlighted: function () {
    return _.first(this.where({ highlighted: true }));
  }

});
