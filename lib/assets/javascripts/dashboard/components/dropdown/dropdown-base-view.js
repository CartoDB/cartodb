var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

var DEFAULTS = {
  width: 160,
  speedIn: 150,
  speedOut: 300,
  verticalPosition: 'down',
  horizontalPosition: 'right',
  tick: 'right',
  verticalOffset: 0,
  horizontalOffset: 0
};

module.exports = CoreView.extend({
  className: 'dropdown',

  initialize: function (options) {
    _.bindAll(this, 'open', 'hide', '_handleClick', '_keydown', '_onDocumentClick');

    this.options = {};
    // Extend options
    _.defaults(this.options, options, DEFAULTS);

    if (options.template) {
      this.template = options.template;
    }

    // Bind to target
    $(options.target).on('click', this._handleClick);
    $(document).on('keydown', this._keydown);
    $(document).on('click', this._onDocumentClick);

    this.modelView = new Backbone.Model({
      open: false
    });

    this.modelView.on('change:open', function (model, isOpen) {
      isOpen ? this.hide() : this.open();
    }, this);
  },

  render: function () {
    // Render
    var $el = this.$el;
    $el
      .html(this.template && this.template(this.options))
      .css({
        width: this.options.width
      });
    return this;
  },

  _handleClick: function (event) {
    if (event) {
      event.preventDefault();
    }

    var isOpen = this.modelView.get('open');
    this.modelView.set('open', !isOpen);
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);
    var $target = $(this.options.target);
    var isTarget = $el.get(0) === $target.get(0);
    if (!isTarget && $el.closest('.Dropdown').length === 0) {
      this.modelView.set({open: false}, {silent: true});
      this.hide();
    }
  },

  _keydown: function (event) {
    if (event.keyCode === 27) {
      this.modelView.set('open', false);
    }
  },

  hide: function () {
    this.$el.hide();
  },

  show: function () {
    this.$el.css({
      display: 'block',
      opacity: 1
    });
  },

  open: function (event, target) {
    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    // Positionate
    var targetPos = $target[this.options.position || 'offset']();
    var targetWidth = $target.outerWidth();
    var targetHeight = $target.outerHeight();
    var elementWidth = this.$el.outerWidth();
    var elementHeight = this.$el.outerHeight();
    var verticalPosition = this.options.verticalPosition;
    var verticalOffset = this.options.verticalOffset;
    var horizontalPosition = this.options.horizontalPosition;
    var horizontalOffset = this.options.horizontalOffset;

    this.$el.css({
      top: targetPos.top + parseInt((verticalPosition === 'up') ? (-elementHeight - 10 - verticalOffset) : (targetHeight + 10 - verticalOffset)),
      left: targetPos.left + parseInt((horizontalPosition === 'left') ? (horizontalOffset - 15) : (targetWidth - elementWidth + 15 - horizontalOffset))
    })
      .addClass(
        // Add vertical and horizontal position class
        (verticalPosition === 'up' ? 'vertical_top' : 'vertical_bottom') +
        ' ' +
        (horizontalPosition === 'right' ? 'horizontal_right' : 'horizontal_left') +
        ' ' +
        // Add tick class
        'tick_' + this.options.tick
      );

    this.show();
  },

  isOpen: function () {
    return this.modelView.get('open');
  },

  clean: function () {
    const target = $(this.options.target);
    this.options.target && target.off('click', this._handleClick);
    $(document).off('keydown', this._keydown);
    $(document).off('click', this._onDocumentClick);
    CoreView.prototype.clean.apply(this);
  }
});
