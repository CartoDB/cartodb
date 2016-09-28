var Backbone = require('backbone');
var CustomListItemModel = require('./custom-list-item-model');
var _ = require('underscore');

/*
 *  Custom list collection, it parses pairs like:
 *
 *  [{ val, label }]
 *  ["string"]
 */

module.exports = Backbone.Collection.extend({
  sort_key: 'id', // default sort key

  initialize: function (models, options) {
    this.options = _.extend({ silent: true }, options);
    this._initBinds();
  },

  comparator: function (item) {
    return item.get(this.sort_key) ? item.get(this.sort_key).toLowerCase() : item.get(this.sort_key);
  },

  model: function (attrs, opts) {
    var d = {};
    if (typeof attrs === 'string') {
      d.val = attrs;
    } else {
      d = attrs;
    }
    return new CustomListItemModel(d, opts);
  },

  sortByKey: function (key) {
    this.sort_key = key;
    this.sort();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  search: function (query) {
    if (!query) return this;
    query = query.toLowerCase();

    return _(this.filter(function (model) {
      var name = model.getName();
      var val = name ? name.toLowerCase() : name;
      return val ? ~val.indexOf(query) : -1;
    }));
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid) {
          m.set({
            selected: false
          }, {
            silent: this.options.silent
          });
        }
      }, this);
    }
  },

  getSelectedItem: function () {
    return _.first(
      this.where({ selected: true })
    );
  },

  containsValue: function (value) {
    return this.find(function (mdl) {
      return mdl.getValue() === value;
    });
  },

  setSelected: function (value) {
    var selectedModel;
    var silent = { silent: this.options.silent };

    this.each(function (mdl) {
      if (mdl.getValue() === value) {
        mdl.set({
          selected: true
        }, silent);
        selectedModel = mdl;
      } else {
        mdl.set({
          selected: false
        }, silent);
      }
    });
    return selectedModel;
  },

  removeSelected: function () {
    this.each(function (mdl) {
      mdl.set({
        selected: false
      });
    });
  }
});
