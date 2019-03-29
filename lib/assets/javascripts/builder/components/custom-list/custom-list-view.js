var CoreView = require('backbone/core-view');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var emptyTemplate = require('./custom-list-empty.tpl');
var addTemplate = require('./custom-list-add.tpl');
var template = require('./custom-list.tpl');
var Utils = require('builder/helpers/utils');

var ARROW_DOWN_KEY_CODE = 40;
var ARROW_UP_KEY_CODE = 38;
var ENTER_KEY_CODE = 13;

module.exports = CoreView.extend({
  module: 'components:custom-list:custom-list-view',

  options: {
    size: 3
  },

  className: 'CDB-Text CDB-Size-medium CustomList-listWrapper',

  tagName: 'div',

  events: {
    'click .js-add-custom-value': '_onClickAddCustomValue',
    'mouseover': '_onMouseOver',
    'mouseout': '_onMouseOut'
  },

  initialize: function (opts) {
    this.options = _.extend({}, this.options, opts);

    this._onKeyDownBinded = this._onKeyDown.bind(this);
    this._needsMaxSize = true;

    if (this.options.mouseOverAction) {
      this._mouseOverAction = this.options.mouseOverAction;
    }

    if (this.options.mouseOutAction) {
      this._mouseOutAction = this.options.mouseOutAction;
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._removeArrowBinds();
    this._destroyCustomScroll();
    this.$el.empty();

    var query = this.model.get('query');
    var items = this.collection.search(query);

    this.$el.append(template());

    var allowFreeTextInput = this.options.allowFreeTextInput;

    if (allowFreeTextInput && query && !Utils.isBlank(query)) {
      if (!this.collection.containsValue(query)) {
        this.$el.prepend(
          addTemplate({
            query: query,
            typeLabel: this.options.typeLabel
          })
        );
      }
    }

    if (items.size() > 0) {
      items.each(this._renderItem, this);
      this._applyArrowBinds();
      // Perfect-scroll needs to have the element in the DOM in order to
      // style/positionate the scroll properly, small trick
      setTimeout(this._applyCustomScroll.bind(this), 0);
    } else if (!allowFreeTextInput || Utils.isBlank(query)) {
      this.$el.append(
        emptyTemplate({
          query: query,
          typeLabel: this.options.typeLabel
        })
      );
    }

    return this;
  },

  _renderItem: function (model) {
    if (model.get('hidden')) return;
    var ItemViewClass = this.options.itemView;

    var itemView = new ItemViewClass({
      model: model,
      typeLabel: this.options.typeLabel,
      template: this.options.itemTemplate
    });
    this.$('.js-list').append(itemView.render().el);
    this.addView(itemView);

    itemView.bind('customEvent', function (eventName, item) {
      this.trigger('customEvent', eventName, item, this);
    }, this);
  },

  _initBinds: function () {
    this.model.bind('change:query', this._onQueryChanged, this);
  },

  _applyArrowBinds: function () {
    document.addEventListener('keydown', this._onKeyDownBinded);
  },

  _removeArrowBinds: function () {
    document.removeEventListener('keydown', this._onKeyDownBinded);
  },

  _getSelected: function () {
    var selectedModel = this.collection.getSelectedItem();
    var selectedValue;

    if (selectedModel) {
      selectedValue = selectedModel.getValue();
      return this.$("[data-val='" + selectedValue + "']");
    }

    return null;
  },

  _highlightSelected: function (item) {
    var itemHeight = item.outerHeight();
    item.addClass('is-highlighted');
    this.$('.js-list').scrollTop(item.index() * itemHeight);
  },

  _onClickAddCustomValue: function (event) {
    this.killEvent(event);

    var query = this.model.get('query');

    var model = this.collection.add({
      val: query,
      label: '“' + query + '”',
      dirty: true
    });

    this.collection.sortByKey('val');
    model.set('selected', true);
  },

  _onKeyDown: function (event) {
    if (this.model.get('visible') === false) {
      return;
    }

    var key = event.which;
    var $listItems = this.$('.js-listItem');
    var $highlighted = $listItems.filter('.is-highlighted');
    var $current;
    var model;

    $highlighted.removeClass('is-highlighted');

    if (key === ARROW_DOWN_KEY_CODE) {
      if (!$highlighted.length || $highlighted[0] === $listItems.last()[0]) {
        $current = $listItems.eq(0);
      } else {
        $current = $highlighted.next();
      }
    } else if (key === ARROW_UP_KEY_CODE) {
      if (!$highlighted.length || $highlighted[0] === $listItems.first()[0]) {
        $current = $listItems.last();
      } else {
        $current = $highlighted.prev();
      }
    } else if (key === ENTER_KEY_CODE) {
      event.preventDefault();
      if ($highlighted && $highlighted.length) {
        model = _.first(this.collection.where({ val: $highlighted.data('val') }));
        if (model) {
          model.set('selected', true);
        }
        return false;
      }
    }

    $current && this._highlightSelected($current);
  },

  _onQueryChanged: function () {
    var prevQuery = this.collection.findWhere({ val: this.model.previous('query'), dirty: true });
    this.collection.remove(prevQuery);

    this.render();
  },

  _applyCustomScroll: function () {
    Ps.initialize(this._wrapperContainer().get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 20
    });
  },

  _destroyCustomScroll: function () {
    if (this._wrapperContainer().length > 0) {
      Ps.destroy(this._wrapperContainer().get(0));
    }
  },

  _wrapperContainer: function () {
    return this.$('.js-list');
  },

  clean: function () {
    this._removeArrowBinds();
    this._destroyCustomScroll();
    CoreView.prototype.clean.apply(this);
  },

  highlight: function () {
    var selected = this._getSelected();
    selected && this._highlightSelected(selected);
  },

  _onMouseOver: function () {
    this._mouseOverAction && this._mouseOverAction();
  },

  _onMouseOut: function () {
    this._mouseOutAction && this._mouseOutAction();
  }
});
