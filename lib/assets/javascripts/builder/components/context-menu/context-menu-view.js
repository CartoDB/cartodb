var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var CustomListView = require('builder/components/custom-list/custom-list-view');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');
var itemTemplate = require('builder/components/custom-list/custom-list-item.tpl');
var magicPositioner = require('builder/helpers/magic-positioner');
var DropdownOverlayView = require('builder/components/dropdown-overlay/dropdown-overlay-view');

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
  },

  _destroyDocumentBinds: function () {
    $(document).off('keydown', this._onEscapePressed);
  },

  render: function () {
    var $body = $('body');
    var posX = (this.options.position.x || 0) + this.options.offset.x;
    var posY = (this.options.position.y || 0) + this.options.offset.y;

    this.clearSubViews();
    this.$el.empty();
    this._renderList();

    this.$el.toggle(this.isVisible());

    $body.append(this.el);

    this.$el.css(
      magicPositioner({
        parentView: $body,
        posX: posX,
        posY: posY
      })
    );

    this.dropdownOverlay = new DropdownOverlayView({
      visible: this.isVisible(),
      onClickAction: this.hide.bind(this)
    });
    this.addView(this.dropdownOverlay);

    return this;
  },

  _onEscapePressed: function (ev) {
    if (ev.which === ESCAPE_KEY_CODE) {
      this.hide();
    }
  },

  _renderList: function () {
    this._listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      typeLabel: '',
      itemView: this.options.itemView,
      itemTemplate: this.options.itemTemplate,
      size: 5
    });
    this.$el.append(this._listView.render().el);
    this.addView(this._listView);
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

  clean: function () {
    this._destroyDocumentBinds();
    CoreView.prototype.clean.apply(this);
  }
});
