var cdb = require('cartodb.js');
var _ = require('underscore');
var Ps = require('perfect-scrollbar');
var emptyTemplate = require('./custom-list-empty.tpl');
var template = require('./custom-list.tpl');

module.exports = cdb.core.View.extend({

  className: 'CDB-Text CDB-Size-medium CustomList-listWrapper',
  tagName: 'div',

  initialize: function () {
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
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  },

  _removeArrowBinds: function () {
    document.removeEventListener('keydown', this._onKeyDown);
  },

  _onKeyDown: function (e) {
    var key = e.which;
    var $listItems = this.$('.js-listItem');
    var $highlighted = $listItems.filter('.is-highlighted');
    var $current;

    $listItems.removeClass('is-highlighted');

    if (key === 40) {
      if (!$highlighted.length || $highlighted[0] === $listItems.last()[0]) {
        $current = $listItems.eq(0);
      } else {
        $current = $highlighted.next();
      }
    } else if (key === 38) {
      if (!$highlighted.length || $highlighted[0] === $listItems.first()[0]) {
        $current = $listItems.last();
      } else {
        $current = $highlighted.prev();
      }
    } else if (key === 13) {
      e.preventDefault();
      if ($highlighted && $highlighted.length) {
        var mdl = _.first(this.collection.where({ val: $highlighted.data('val') }));
        if (mdl) {
          mdl.set('selected', true);
        }
        return false;
      }
    }

    if ($current) {
      $current.addClass('is-highlighted');
      var itemHeight = $current.outerHeight();
      this.$('.js-list').scrollTop($current.index() * itemHeight);
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
    this._removeArrowBinds();
    this._destroyCustomScroll();
    cdb.core.View.prototype.clean.apply(this);
  }

});
