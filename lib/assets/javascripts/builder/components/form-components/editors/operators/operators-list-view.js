var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
var CustomListView = require('builder/components/custom-list/custom-view');
var DropdownOverlayView = require('builder/components/dropdown-overlay/dropdown-overlay-view');
var OperatorsListModel = require('./operators-list-model');
var emptyTemplate = require('./operators-list-count.tpl');
var template = require('./operators-list.tpl');

module.exports = CoreView.extend({

  className: 'Editor-dropdown Editor-boxModal Editor-dropdownOperators',
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

    this._dropdownOverlay = new DropdownOverlayView({
      onClickAction: this.hide.bind(this),
      visible: this.model.get('visible')
    });
    this.addView(this._dropdownOverlay);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:operator change:attribute', _.debounce(this._onModelChange.bind(this), 10));
    this.model.bind('change:visible', function (mdl, isVisible) {
      this._toggleVisibility();

      if (!isVisible) {
        this._destroyList();
        this.$('.js-list').html(emptyTemplate());
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
    if (this.model.get('operator') !== 'count') {
      if (this._hasList()) {
        return;
      }

      this._listView = new CustomListView({
        className: 'CDB-Dropdown-options CDB-Text CDB-Size-medium',
        collection: this.collection,
        showSearch: true,
        typeLabel: this.options.keyAttr
      });
      this.$('.js-list').html(this._listView.render().el);
    } else {
      this._destroyList();
      this.$('.js-list').html(emptyTemplate());
    }
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

  isVisible: function () {
    return this.model.get('visible');
  },

  remove: function () {
    this._destroyList();
    this.$el.empty();
    CoreView.prototype.remove.call(this);
  }
});
