var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var CustomListView = require('../../../custom-list/custom-view');
var OperatorsListModel = require('./operators-list-model');
var emptyTemplate = require('./operators-list-count.tpl');
var template = require('./operators-list.tpl');

module.exports = cdb.core.View.extend({

  className: 'Editor-dropdown Editor-boxModal',
  tagName: 'div',

  events: {
    'change input[name="operator"]': '_onOperationChange'
  },

  initialize: function (opts) {
    this.model = new OperatorsListModel({
      operator: opts.operator,
      attribute: opts.attribute,
      visible: false
    });

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
        this.remove();
      } else {
        this.render();
      }
    }, this);
    this.collection.bind('change:selected', this._onAttributeSelected, this);
    this.add_related_model(this.collection);
  },

  _renderList: function () {
    if (this._listView) {
      this.removeView(this._listView);
      this._listView.clean();
    }

    if (this.model.get('operator') !== 'count') {
      this._listView = new CustomListView({
        className: 'CDB-Dropdown-options CDB-Text CDB-Size-medium',
        collection: this.collection,
        showSearch: true,
        typeLabel: this.options.keyAttr
      });
      this.addView(this._listView);
      this.$('.js-list').html(this._listView.render().el);
    } else {
      this.$('.js-list').html(emptyTemplate());
    }
  },

  _onModelChange: function () {
    if (this.model.isValid()) {
      this.trigger('change', this.model.toJSON(), this);
    }
  },

  _onOperationChange: function (ev) {
    var $input = $(ev.target);
    var operator = $input.val();

    if (operator === 'count') {
      this.model.set('attribute', '');
      this.collection.removeSelected();
    }

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

  remove: function () {
    this.clearSubViews();
    this.$el.empty();
  },

  isVisible: function () {
    return this.model.get('visible');
  }

});
