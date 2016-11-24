var CoreView = require('backbone/core-view');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var emptyTemplate = require('./custom-list-empty.tpl');
var addTemplate = require('./custom-list-add.tpl');
var template = require('./custom-list.tpl');
var ARROW_DOWN_KEY_CODE = 40;
var Utils = require('../../helpers/utils');
var ARROW_UP_KEY_CODE = 38;
var ENTER_KEY_CODE = 13;

module.exports = CoreView.extend({
  options: {
    size: 3
  },

  className: 'CDB-Text CDB-Size-medium CustomList-listWrapper',

  tagName: 'div',

  events: {
    'click .js-add-custom-value': '_onClickAddCustomValue'
  },

  initialize: function (opts) {
    this.options = _.extend({}, this.options, opts);
    this._onKeyDownBinded = this._onKeyDown.bind(this);
    this._needsMaxSize = true;
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
    var containsValue = !this.collection.containsValue(query);

    if (allowFreeTextInput && query && !Utils.isBlank(query) && containsValue) {
      this.$el.prepend(
        addTemplate({
          query: query,
          typeLabel: this.options.typeLabel
        })
      );
    }

    if (items.size() > 0) {
      items.each(this._renderItem, this);
      this._applyCustomScroll();
      this._applyArrowBinds();
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

  setMaxSize: function () {
    if (!this._needsMaxSize) {
      return;
    }

    var height = this.$('.CustomList-list').children(':first').outerHeight();
    this.$('.js-list').css({
      'max-height': (height * this.options.size)
    });
    this._checkScroll();
    this._needsMaxSize = false;
  },

  _checkScroll: function () {
    var $el = this._wrapperContainer();
    var el = $el.get(0);
    $el.toggleClass('CustomList-list--visible', el.scrollHeight > el.clientHeight);
  },

  _renderItem: function (mdl) {
    var ItemViewClass = this.options.ItemView;
    var itemView = new ItemViewClass({
      model: mdl,
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
    this.model.bind('change:query', this.render, this);
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

  _onClickAddCustomValue: function (e) {
    this.killEvent(e);

    var query = this.model.get('query');

    var mdl = this.collection.add({
      val: query,
      label: '“' + query + '”'
    });

    this.collection.sortByKey('val');
    mdl.set('selected', true);
  },

  _onKeyDown: function (e) {
    if (this.model.get('visible') === false) {
      return;
    }

    var key = e.which;
    var $listItems = this.$('.js-listItem');
    var $highlighted = $listItems.filter('.is-highlighted');
    var $current;
    var mdl;

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
      e.preventDefault();
      if ($highlighted && $highlighted.length) {
        mdl = _.first(this.collection.where({ val: $highlighted.data('val') }));
        if (mdl) {
          mdl.set('selected', true);
        }
        return false;
      }
    }

    $current && this._highlightSelected($current);
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
  }
});
