var _ = require('underscore');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var CustomListView = require('builder/components/custom-list/custom-view');
var QueryColumnModel = require('builder/data/query-column-model');

module.exports = CustomListItemView.extend({

  events: _.extend(
    CustomListItemView.prototype.events,
    {
      'click .js-desc': '_onDescClick',
      'click .js-asc': '_onAscClick',
      'click .js-order': 'killEvent'
    }
  ),

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(
      this.options.template(
        {
          typeLabel: this.options.typeLabel,
          isSelected: this.model.get('selected'),
          isDisabled: this.model.get('disabled'),
          isDestructive: this.model.get('destructive'),
          isOrderBy: this.model.get('isOrderBy'),
          sortBy: this.model.get('sortBy'),
          name: this.model.getName(),
          val: this.model.getValue()
        }
      )
    );

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  },

  _onClick: function (ev) {
    this.killEvent(ev);

    if (this.model.getValue() === 'change') {
      this._openSubContextMenu(ev);
    } else {
      this.model.set('selected', true);
    }
  },

  _hideSubContextMenu: function () {
    if (this._subContextMenu) {
      this._subContextMenu.clean();
      this.removeView(this._subContextMenu);
      delete this.collection;
      delete this._subContextMenu;
    }
  },

  _openSubContextMenu: function (ev) {
    if (this._subContextMenu) {
      this._hideSubContextMenu();
    }

    var subContextClassName = 'Table-columnTypeMenu ';
    if (this.model.get('isLastColumns')) {
      subContextClassName += ' Table-columnTypeMenu--toLeft ';
    }

    this._subContextMenu = new CustomListView({
      className: subContextClassName + CustomListView.prototype.className,
      options: [
        {
          label: _t('components.table.columns.types.number'),
          disabled: !QueryColumnModel.isTypeChangeAllowed(this.model.get('type'), 'number'),
          val: 'number'
        }, {
          label: _t('components.table.columns.types.string'),
          disabled: !QueryColumnModel.isTypeChangeAllowed(this.model.get('type'), 'string'),
          val: 'string'
        }, {
          label: _t('components.table.columns.types.date'),
          disabled: !QueryColumnModel.isTypeChangeAllowed(this.model.get('type'), 'date'),
          val: 'date'
        }, {
          label: _t('components.table.columns.types.boolean'),
          disabled: !QueryColumnModel.isTypeChangeAllowed(this.model.get('type'), 'boolean'),
          val: 'boolean'
        }
      ],
      showSearch: false,
      typeLabel: ''
    });

    this._subContextMenu.collection.bind('change:selected', function (menuItem) {
      if (!menuItem.get('disabled')) {
        this.model.set({
          type: menuItem.getValue(),
          selected: true
        });
      }
    }, this);

    this.$el.closest('.Table-columnMenu').append(this._subContextMenu.render().el);
    this._subContextMenu.show();
    this.addView(this._subContextMenu);
  },

  _onAscClick: function (ev) {
    this.killEvent(ev);
    this.model.set({
      sort: 'asc',
      selected: true
    });
  },

  _onDescClick: function (ev) {
    this.killEvent(ev);
    this.model.set({
      sort: 'desc',
      selected: true
    });
  }

});
