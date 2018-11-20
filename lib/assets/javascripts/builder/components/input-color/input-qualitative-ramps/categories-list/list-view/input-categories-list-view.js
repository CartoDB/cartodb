var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var Utils = require('builder/helpers/utils');
var CategoriesListView = require('./categories-list-view');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');
var template = require('./input-color-categories-list-view.tpl');
var itemTemplate = require('../list-item-view/categories-list-item.tpl');

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-qualitative-ramps:categories-list:list-view:input-categories-list-view',

  events: {
    'click .js-color': '_onClickColor',
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;
    this._maxValues = opts.maxValues;
    this._requiredNumberOfColors = opts.requiredNumberOfColors;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      range: this.model.get('range'),
      attribute: this.model.get('attribute'),
      requiredNumberOfColors: this._requiredNumberOfColors
    }));

    this._setupCollection();
    this._initBinds();

    this._listView = new CategoriesListView({
      itemTemplate: itemTemplate,
      collection: this._collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel,
      maxValues: this._maxValues,
      imageEnabled: this.options.imageEnabled
    });

    this.addView(this._listView);

    this.$('.js-content').append(this._listView.render().$el);

    return this;
  },

  _setupCollection: function () {
    this._collection = new CustomListCollection(null, { silent: false });

    var range = this.model.get('range');
    var domain = this.model.get('domain');
    var images = this.model.get('images');

    if (range && range.length && domain && domain.length) {
      var categories = _.map(range, function (color, i) {
        var isNull = domain[i] == null || (_.isString(domain[i]) && Utils.isBlank(domain[i]));
        var label = domain[i];

        if (i >= this._maxValues) {
          label = _t('form-components.editors.fill.input-qualitative-ramps.others');
        } else if (isNull) {
          label = _t('form-components.editors.fill.input-qualitative-ramps.null');
        }

        var attrs = {
          label: label,
          val: color
        };

        if (images && images.length) {
          attrs['image'] = images[i];
        }

        return attrs;
      }, this);

      this._collection.reset(categories);
    }
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:range', this.render);
    this.listenTo(this.model, 'change:domain', this.render);
    this.listenTo(this.model, 'change:index', this.render);
    this.listenTo(this._collection, 'change:selected', this._onSelectItem);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickColor: function (e) {
    this.killEvent(e);

    var index = $(e.target).index();
    var color = this._collection.at(index);
    color && this._onSelectItem(color);
  },

  _onSelectItem: function (item) {
    var selectedItem = {
      index: this._collection.indexOf(item),
      target: _.contains(item.get('selectedClass'), 'js-assetPicker') ? 'asset' : 'color'
    };

    this.trigger('selectItem', selectedItem, this);
  }
});
