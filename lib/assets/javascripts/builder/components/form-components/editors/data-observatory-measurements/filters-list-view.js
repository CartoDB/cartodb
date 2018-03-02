var CoreView = require('backbone/core-view');
var CustomListView = require('builder/components/custom-list/custom-view');
var CustomListItemView = require('./filter-list-item-view');
var itemListTemplate = require('./filter-list-item.tpl');
var template = require('./filter-list-view.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var statusTemplate = require('./list-view-states.tpl');

var REQUIRED_OPTS = [
  'filtersCollection'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();

    this._listView = new CustomListView({
      className: 'DO-Filters',
      typeLabel: _t('components.backbone-forms.data-observatory.dropdown.filter.item-label'),
      showSearch: false,
      collection: this._filtersCollection,
      itemTemplate: itemListTemplate,
      itemView: CustomListItemView
    });

    this.addView(this._listView);
  },

  render: function () {
    this.$el.append(template({
      headerTitle: _t('components.backbone-forms.data-observatory.dropdown.filter.header')
    }));

    this._renderListSection();
    return this;
  },

  _renderListSection: function () {
    var status = this._filtersCollection.stateModel.get('state');
    if (status === 'fetched') {
      this.$('.js-content').html(this._listView.render().$el);
    } else {
      this._createStatusView(status);
    }
  },

  _createStatusView: function (status) {
    var el = statusTemplate({
      status: status,
      type: _t('components.backbone-forms.data-observatory.dropdown.filter.type')
    });

    this.$('.js-content').html(el);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _initBinds: function () {
    this.listenTo(this._filtersCollection.stateModel, 'change:state', this._renderListSection, this);
    this.listenTo(this._filtersCollection, 'change:selected', this._onSelectItem, this);
  },

  _onSelectItem: function (item) {
    this.trigger('selectItem', item, this);
  }
});
