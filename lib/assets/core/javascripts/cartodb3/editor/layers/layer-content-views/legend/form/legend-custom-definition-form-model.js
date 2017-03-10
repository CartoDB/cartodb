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
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;

    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);

    this._initialItems();
  },

  _initialItems: function () {
    var items;
    var categories = this.legendDefinitionModel.get('items');
    items = categories.map(function (v, index) {
      return LegendColorHelper.buildSwatch(v.color, v.title, v.icon);
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
            className: 'u-flex',
            userModel: this._userModel,
            configModel: this._configModel,
            modals: this._modals
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
            title: item.title,
            color: item.fill.color.fixed,
            image: item.fill.color.image
          };
        })
      }
    );
  }
});
