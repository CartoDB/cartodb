var $ = require('jquery');
var CoreView = require('backbone/core-view');
var menuOverlayTemplate = require('./dropdown-overlay.tpl');

/*
 *  Dropdown overlay to disable all interactions between elements
 *  beneath the dropdown
 */
module.exports = CoreView.extend({
  initialize: function (opts) {
    this.dropdownElement = opts && opts.dropdownElement;

    this._onOverlayClicked = this._onOverlayClicked.bind(this);

    this.render();
    this._initBinds();
  },

  _initBinds: function () {
    this.contextMenuOverlay.on('click', this._onOverlayClicked);
  },

  _destroyBinds: function () {
    this.contextMenuOverlay.off('click', this._onOverlayClicked);
  },

  render: function () {
    if (this.contextMenuOverlay) {
      this._destroyOverlay();
    }

    this._renderOverlay();

    return this;
  },

  _renderOverlay: function () {
    var modalElement = this.isInsideModal();
    this.contextMenuOverlay = $(menuOverlayTemplate());
    (modalElement || $(document.body)).append(this.contextMenuOverlay);
  },

  _destroyOverlay: function () {
    this.contextMenuOverlay.off('click', this._onOverlayClicked);
    this.contextMenuOverlay.remove();
  },

  _onOverlayClicked: function () {
    this.trigger('overlayClicked', this);
    this.hide();
  },

  show: function () {
    this.contextMenuOverlay.toggle(true);
  },

  hide: function () {
    this.contextMenuOverlay.toggle(false);
  },

  isInsideModal: function () {
    if (!this.dropdownElement) return false;

    var modalElement = this.dropdownElement.closest('.Dialog');
    return modalElement.length ? modalElement : false;
  },

  clean: function () {
    this._destroyBinds();
    this._destroyOverlay();
    CoreView.prototype.clean.apply(this);
  }
});
