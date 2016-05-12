var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var CustomListView = require('../custom-list/custom-list-view');
var CustomListItemView = require('../custom-list/custom-list-item-view');
var itemTemplate = require('../custom-list/custom-list-item.tpl');

/*
 *  A custom menu
 *
 */
module.exports = cdb.core.View.extend({

  options: {
    offset: {},
    itemTemplate: itemTemplate,
    itemView: CustomListItemView
  },

  className: 'CDB-Box-modal CDB-SelectItem CustomList--small',
  tagName: 'div',

  initialize: function (opts) {
    opts = opts || {};
    if (!opts.collection) {
      throw new Error('triggerElement option is required');
    }

    if (!opts.triggerElement) {
      throw new Error('triggerElement option is required');
    }

    this.options = _.extend({}, this.options, opts);

    this.model = new cdb.core.Model({
      query: '',
      visible: false
    });

    this._initBinds();

    document.addEventListener('keydown', this._onEscapePressed.bind(this));
    document.addEventListener('click', this._onDocumentElementClicked.bind(this));
  },

  _onEscapePressed: function (ev) {
    if (ev.which === $.ui.keyCode.ESCAPE) {
      this.hide();
    }
  },

  _onDocumentElementClicked: function (e) {
    var clickedElement = e.target;
    if (this.options.triggerElement === clickedElement) {
      this.toggle();
    } else {
      this.hide();
    }
  },

  remove: function () {
    document.removeEventListener('keydown', this._onEscapePressed.bind(this));
    document.removeEventListener('click', this._onDocumentElementClicked.bind(this));
  },

  _initBinds: function () {
    this.model.bind('change:visible', function (mdl, isVisible) {
      this.render();
    }, this);

    this.collection.bind('change:selected', function (menuItem) {
      this.hide();
    }, this);
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();
    this._renderList();

    if (this.options.offset) {
      _.each(['top', 'right', 'bottom', 'left'], function (attr) {
        var val = this.options.offset[attr];
        if (val) {
          this.$el.css(attr, val);
        }
      }, this);
    }

    if (this.isVisible()) {
      this.$el.show();
    } else {
      this.$el.hide();
    }

    return this;
  },

  _renderList: function () {
    var listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      typeLabel: '',
      ItemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate
    });
    this.$el.append(listView.render().el);
    this.addView(listView);
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
  }
});
