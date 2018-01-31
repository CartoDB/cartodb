var _ = require('underscore');
var $ = require('jquery');
var Utils = require('../../../../../../helpers/utils');
var CoreView = require('backbone/core-view');
var CategoriesListView = require('./categories-list/categories-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var template = require('./input-color-categories-list-view.tpl');
var itemTemplate = require('./input-color-categories-list-item.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-color': '_onClickColor'
  },

  initialize: function (opts) {
    this._showSearch = opts.showSearch || false;
    this._typeLabel = opts.typeLabel;
    this._maxValues = opts.maxValues;

    this._setupCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      range: this.model.get('range'),
      attribute: this.model.get('attribute')
    }));

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
    this._collection = new CustomListCollection(null, {silent: false});

    var range = this.model.get('range');
    var domain = this.model.get('domain');
    var images = this.model.get('images');

    if (range && range.length && domain && domain.length) {
      var categories = _.map(range, function (color, i) {
        var isNull = domain[i] == null || (_.isString(domain[i]) && Utils.isBlank(domain[i]));
        var label = domain[i];

        if (i >= this._maxValues) {
          label = _t('form-components.editors.fill.input-categories.others');
        } else if (isNull) {
          label = _t('form-components.editors.fill.input-categories.null');
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

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:range', this.render);
    this.listenTo(this.model, 'change:domain', this.render);
    this.listenTo(this._collection, 'change:selected', this._onSelectItem);
  },

  _onClickColor: function (ev) {
    this.killEvent(ev);
    var index = $(ev.target).index();
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
