var $ = require('jquery');
var CoreView = require('backbone/core-view');

/*
 *  Dropdown overlay to disable all interactions between elements
 *  beneath the dropdown
 */
module.exports = CoreView.extend({

  className: 'CDB-Box-modalOverlay',

  events: {
    'click': '_onOverlayClicked'
  },

  initialize: function (opts) {
    this.dropdownElement = opts && opts.dropdownElement;
    this.render();
  },

  render: function () {
    var modalElement = this.isInsideModal();
    (modalElement || $(document.body)).append(this.el);

    return this;
  },

  _onOverlayClicked: function () {
    this.trigger('overlayClicked', this);
    this.hide();
  },

  show: function () {
    this.$el.toggle(true);
  },

  hide: function () {
    this.$el.toggle(false);
  },

  toggle: function (visibleState) {
    this.$el.toggle(visibleState);
  },

  isInsideModal: function () {
    if (!this.dropdownElement) return false;

    var modalElement = this.dropdownElement.closest('.Dialog');
    return modalElement.length ? modalElement : false;
  }
});
