var cdb = require('cartodb.js');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var emptyTemplate = require('./custom-list-empty.tpl');
var template = require('./custom-list.tpl');

/*
 *
 *
 *
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CDB-Text CDB-Size-medium CustomList-listWrapper',
  tagName: 'div',

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();
    this._destroyCustomScroll();
    this._removeArrowBinds();

    var query = this.model.get('query');
    var items = this.collection.search(query);

    this.$el.append(template());

    if (items.size() > 0) {
      items.each(this._renderItem, this);
      this._$listItems = this.$('.js-listItem');
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
      template: this.options.itemTemplate
    });
    this.$('.js-list').append(itemView.render().el);
    this.addView(itemView);
  },

  _initBinds: function () {
    this.model.bind('change:query', this.render, this);
  },

  _applyArrowBinds: function () {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  },

  _removeArrowBinds: function () {
    document.removeEventListener('keydown', this._onKeyDown.bind(this));
  },

  _onKeyDown: function (e) {
    var key = e.keyCode;
    var $selected = this._$listItems.filter('.is-highlighted');
    var $current;

    this._$listItems.removeClass('is-highlighted');

    if (key === 40) {
      if (!$selected.length || $selected.is(':last-child')) {
        $current = this._$listItems.eq(0);
      } else {
        $current = $selected.next();
      }
    } else if (key === 38) {
      if (!$selected.length || $selected.is(':first-child')) {
        $current = this._$listItems.last();
      } else {
        $current = $selected.prev();
      }
    } else if (key === 13) {
      if ($selected && $selected.length) {
        var mdl = _.first(this.collection.where({ val: $selected.data('val') }));
        if (mdl) {
          mdl.set('selected', true);
          return false;
        }
      }
    }

    if ($current) {
      $current.addClass('is-highlighted');
    }
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
    this._destroyCustomScroll();
    this._removeArrowBinds();
    cdb.core.View.prototype.clean.apply(this);
  }

});
