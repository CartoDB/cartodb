var _ = require('underscore');
var Utils = require('../../../../../../helpers/utils');
var CoreView = require('backbone/core-view');
var CustomListView = require('../../../../../custom-list/custom-view');
var CustomListCollection = require('../../../../../custom-list/custom-list-collection');
var template = require('./input-color-categories-list-view.tpl');
var itemTemplate = require('./input-color-categories-list-item.tpl');

module.exports = CoreView.extend({
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

    this._listView = new CustomListView({
      itemTemplate: itemTemplate,
      collection: this._collection,
      showSearch: this._showSearch,
      typeLabel: this._typeLabel
    });

    this.addView(this._listView);

    this.$('.js-content').append(this._listView.render().$el);

    return this;
  },

  _setupCollection: function () {
    this._collection = new CustomListCollection();

    var range = this.model.get('range');
    var domain = this.model.get('domain');

    if (range && range.length && domain && domain.length) {
      var categories = _.map(range, function (color, i) {
        var isNull = domain[i] == null || (_.isString(domain[i]) && Utils.isBlank(domain[i]));
        var label = domain[i];

        if (i >= this._maxValues) {
          label = _t('form-components.editors.fill.input-categories.others');
        } else if (isNull && this.model.get('attribute_type') === 'boolean') {
          label = _t('form-components.editors.fill.input-categories.false');
        } else if (isNull) {
          label = _t('form-components.editors.fill.input-categories.null');
        } else {
          label = _t('form-components.editors.fill.input-categories.others');
        }

        return { label: label, val: color };
      }, this);

      this._collection.reset(categories);
    }
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this.model.on('change:range', this.render, this);
    this.model.on('change:domain', this.render, this);
    this._collection.bind('change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', this._collection.indexOf(item), this);
  }
});
