var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
var CustomListView = require('../../../../../custom-list/custom-view');
var OperatorsListModel = require('./operators-list-model');
var template = require('./operators-list.tpl');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var OperatorListCollection = require('./operators-list-collection');
var CustomListItemView = require('./custom-list-item-view');
var CustomListItemModel = require('../../../../../custom-list/custom-list-item-model');

var REQUIRED_OPTS = [
  'columns'
];

module.exports = CoreView.extend({

  className: 'Editor-boxModalContentOperators',
  tagName: 'div',

  events: {
    'change input[name="operator"]': '_onOperationChange'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new OperatorsListModel({
      operator: opts.operator,
      attribute: opts.attribute,
      visible: false
    });

    this.collection = new OperatorListCollection();

    if (opts.attribute) {
      this.collection.setSelected(opts.attribute);
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(
      template({
        operator: this.model.get('operator')
      })
    );
    this._renderList();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:operator change:attribute', _.debounce(this._onModelChange.bind(this), 10));
    this.model.bind('change:visible', function (mdl, isVisible) {
      this._toggleVisibility();

      if (!isVisible) {
        this._destroyList();
        this.$('.js-operatorsList').html(emptyTemplate());
      } else {
        this.render();
      }
    }, this);
    this.collection.bind('change:selected', this._onAttributeSelected, this);
    this.add_related_model(this.collection);
  },

  _hasList: function () {
    return !!this._listView;
  },

  _renderList: function () {
    this._destroyList();

    var filteredColumns = _.reject(this._columns, function (column) {
      return column.label === 'cartodb_id';
    }, this);

    this.collection.reset(filteredColumns);

    this._listView = new CustomListView({
      className: 'CDB-Dropdown-options CDB-Text CDB-Size-medium',
      collection: this.collection,
      showSearch: true,
      typeLabel: this.options.keyAttr
    });
    this.$('.js-operatorsList').html(this._listView.render().el);
  },

  _destroyList: function () {
    if (this._hasList()) {
      this.removeView(this._listView);
      this._listView.clean();
      delete this._listView;
    }
  },

  _onModelChange: function () {
    if (this.model.isValidOperator()) {
      this.trigger('change', this.model.toJSON(), this);
    }
  },

  _onOperationChange: function (ev) {
    var $input = $(ev.target);
    var operator = $input.val();

    this.model.set('operator', operator);

    this._renderList();
  },

  _onAttributeSelected: function (mdl) {
    if (mdl.get('selected')) {
      this.model.set('attribute', mdl.getValue());
    }
  },

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.model.get('visible'));
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  remove: function () {
    this._destroyList();
    this.$el.empty();
    CoreView.prototype.remove.call(this);
  }
});
