var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var NestedCategory = require('./legend-nested-category-definition-model');
var templateItem = require('../../editor/layers/layer-content-views/legend/legend-list-item.tpl');
var templateList = require('../../editor/layers/layer-content-views/legend/legend-list.tpl');
var LegendColorHelper = require('./legend-color-helper');

module.exports = LegendBaseDefModel.extend({
  defaults: {
    type: 'category',
    items: []
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-size');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);

    this.on('change:categories', function () {
      this.set('items', this.get('items').map(function (item) {
        return {
          name: item.name,
          color: item.fill.color.fixed
        };
      }));
    }, this);

    this._inheritItems();
  },

  _inheritItems: function () {
    var color = this.layerDefinitionModel.styleModel.get('fill').color;
    var items = LegendColorHelper.getCategories(color);
    this.set({categories: items});
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        categories: {
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
