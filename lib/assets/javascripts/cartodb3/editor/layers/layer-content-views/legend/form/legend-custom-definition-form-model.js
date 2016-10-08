var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-form-model');
var NestedCategory = require('./legend-nested-category-definition-form-model');
var templateItem = require('./legend-list-item.tpl');
var templateList = require('./legend-list.tpl');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom',
      items: []
    }
  ),

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);

    this._initialItems();
  },

  _initialItems: function () {
    var items;
    var categories = this.legendDefinitionModel.get('items');
    items = categories.map(function (v, index) {
      return LegendColorHelper.buildSwatch(v.color, v.name);
    });
    this.set({items: items});
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        items: {
          type: 'SortableList',
          itemType: 'CategoryModel',
          model: NestedCategory,
          title: '',
          itemTemplate: templateItem,
          listTemplate: templateList,
          editorAttrs: {
            className: 'u-flex'
          }
        }
      }
    );
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'items'),
      {
        items: this.get('items').map(function (item) {
          return {
            name: item.name,
            color: item.fill.color.fixed
          };
        })
      }
    );
  }
});
