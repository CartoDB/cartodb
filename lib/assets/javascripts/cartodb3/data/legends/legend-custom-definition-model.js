var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var NestedCategory = require('./legend-nested-category-definition-model');
var templateItem = require('../../editor/layers/layer-content-views/legend/legend-list-item.tpl');
var templateList = require('../../editor/layers/layer-content-views/legend/legend-list.tpl');
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

    this.on('change:items', function () {
      this.set('categories', this.get('items').map(function (item) {
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
      _.omit(this.attributes, 'items', 'categories', 'preHTMLSnippet', 'postHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          categories: this.get('categories')
        }
      }
    );
  }
});
