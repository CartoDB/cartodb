var _ = require('underscore');

require('jquery-ui/draggable');

var Template = '<li class="<%- className %>"><%= html %></li>';

var DEFAULT_DRAGGABLE_SCOPE = 'analysis';
var DEFAULT_REVERT_DURATION = 100;

module.exports = cdb.core.View.extend({
  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this.$el.draggable({
      revert: true,
      scope: this.options.draggable_scope || DEFAULT_DRAGGABLE_SCOPE,
      revertDuration: this.options.revert_duration || DEFAULT_REVERT_DURATION,
      start: this._onStartDragging.bind(this),
      stop: this._onDraggableStop.bind(this),
      helper: this._createHelper.bind(this)
    });
    this.className = this.$el.get(0).className;
  },

  _createHelper: function () {
    return _.template(Template)({ className: this.className, html: this.$el.html() });
  },

  _onClick: function (e) {
    e.stopPropagation();

    if (this._preventEditClick) {
      this._preventEditClick = false;
      return;
    }
    this.trigger('click');
  },

  _onStartDragging: function (e, ui) {
    this._preventEditClick = true;
  },

  _onDraggableStop: function (e, ui) {
    if (ui.helper.data('dropped')) {
      this.trigger('dropped');
    }
    this._preventEditClick = false;
  },

  clean: function () {
    if (this.$el.data('ui-draggable')) {
      this.$el.draggable('destroy');
    }
    cdb.core.View.prototype.clean.apply(this);
  }
});
