var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListView = require('../custom-list/custom-list-view');
var CustomListItemView = require('../custom-list/custom-list-item-view');
var itemTemplate = require('../custom-list/custom-list-item.tpl');

var ESCAPE_KEY_CODE = 27;

/*
 *  A context menu
 */
module.exports = CoreView.extend({

  options: {
    position: {
      x: 0,
      y: 0
    },
    offset: {
      x: 0,
      y: 15
    },
    itemTemplate: itemTemplate,
    itemView: CustomListItemView
  },

  className: 'CDB-Box-modal CDB-SelectItem CustomList CustomList--small',
  tagName: 'div',

  initialize: function (opts) {
    opts = opts || {};
    if (!opts.collection) throw new Error('collection option is required');
    if (!opts.triggerElementID) throw new Error('element id is required');

    this._triggerElementID = opts.triggerElementID;

    this.model = new Backbone.Model({
      visible: false
    });

    this._onEscapePressed = this._onEscapePressed.bind(this);
    this._onDocumentElementClicked = this._onDocumentElementClicked.bind(this);

    this._initBinds();
  },

  _initBinds: function () {
    this.model.on('change:visible', function (mdl, isVisible) {
      this.render();
      if (isVisible) {
        this._initDocumentBinds();
      } else {
        this._destroyDocumentBinds();
      }
    }, this);
    this.collection.on('change:selected', this.hide, this);
    this.add_related_model(this.collection);
  },

  _initDocumentBinds: function () {
    $(document).on('keydown', this._onEscapePressed);
    $(document).on('mousedown', this._onDocumentElementClicked);
  },

  _destroyDocumentBinds: function () {
    $(document).off('keydown', this._onEscapePressed);
    $(document).off('mousedown', this._onDocumentElementClicked);
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();
    this._renderList();

    this.$el.toggle(this.isVisible());

    $('body').append(this.el);
    this._setListMaxSize();
    this.$el.css('top', this.options.position.y + this.options.offset.y);
    this.$el.css('left', this.options.position.x + this.options.offset.x - this.$el.outerWidth());

    return this;
  },

  _onEscapePressed: function (ev) {
    if (ev.which === ESCAPE_KEY_CODE) {
      this.hide();
    }
  },

  _onDocumentElementClicked: function (ev) {
    var $el = $(ev.target);
    if ($el.closest(this.$el).length === 0 && $el.closest($('#' + this._triggerElementID)).length === 0) {
      this.hide();
    }
  },

  _renderList: function () {
    this._listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      typeLabel: '',
      ItemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate,
      size: 5
    });
    this.$el.append(this._listView.render().el);
    this.addView(this._listView);
  },

  _setListMaxSize: function () {
    setTimeout(function () {
      this._listView && this._listView.setMaxSize();
      this.$el.addClass('has-visibility');
    }.bind(this), 0);
  },

  show: function () {
    this.model.set('visible', true);
  },

  hide: function () {
    this.model.set('visible', false);
    this.$el.removeClass('has-visibility');
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  clean: function () {
    this._destroyDocumentBinds();
    CoreView.prototype.clean.apply(this);
  }
});
