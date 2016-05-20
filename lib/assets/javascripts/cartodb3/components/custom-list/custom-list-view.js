var cdb = require('cartodb.js');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var emptyTemplate = require('./custom-list-empty.tpl');
var template = require('./custom-list.tpl');
var ARROW_DOWN_KEY_CODE = 40;
var ARROW_UP_KEY_CODE = 38;
var ENTER_KEY_CODE = 13;

module.exports = cdb.core.View.extend({

  className: 'CDB-Text CDB-Size-medium CustomList-listWrapper',
  tagName: 'div',

  initialize: function () {
    this._onKeyDownBinded = this._onKeyDown.bind(this);
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

    if (items.size() > 0) {
      items.each(this._renderItem, this);
      this._applyCustomScroll();
      this._applyArrowBinds();
    } else {
      this.$el.append(
        emptyTemplate({
          query: query,
          typeLabel: this.options.typeLabel
        })
      );
    }

    return this;
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
      return this.$('[data-val="' + selectedValue + '"]');
    }

    return null;
  },

  _highlightSelected: function (item) {
    var itemHeight = item.outerHeight();
    item.addClass('is-highlighted');
    this.$('.js-list').scrollTop(item.index() * itemHeight);
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
    Ps.initialize(this.el.querySelector('.js-list'), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20
    });
  },

  _destroyCustomScroll: function () {
    if (this.el.querySelector('.js-list')) {
      Ps.destroy(this.el.querySelector('.js-list'));
    }
  },

  clean: function () {
    this._removeArrowBinds();
    this._destroyCustomScroll();
    cdb.core.View.prototype.clean.apply(this);
  },

  highlight: function () {
    var selected = this._getSelected();
    selected && this._highlightSelected(selected);
  }

});
