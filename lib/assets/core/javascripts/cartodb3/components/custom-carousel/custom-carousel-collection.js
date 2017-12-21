var Backbone = require('backbone');
var CustomCarouselModel = require('./custom-carousel-item-model');

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
    return new CustomCarouselModel(d);
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
    return this.findWhere({ selected: true });
  },

  getSelectedValue: function () {
    var selectedModel = this.getSelected();
    return selectedModel && selectedModel.get('val');
  },

  getHighlighted: function () {
    return this.findWhere({ highlighted: true });
  }

});
