var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Ps = require('perfect-scrollbar');
var template = require('./scroll.tpl');

module.exports = Backbone.View.extend({
  tagName: 'div',
  className: 'ScrollView',

  initialize: function (opts) {
    if (!opts.view) throw new Error('Inner view is required');
    this._view = opts.view;
    this._viewOptions = _.extend({}, opts.viewOptions);
    this.addScroll();
  },

  _calculateHeight: function () {
    // TODO: fixed height

    var h = $(window).height() - this.$el.offset().top;

    this.$el.css({
      position: 'relative',
      padding: '2px 0',
      height: h - 4
    });
  },

  addScroll: function () {
    Ps.initialize(this.$el.get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20
    });
  },

  destroyScroll: function () {
    Ps.destroy(this.$el.get(0));
  },

  render: function () {
    if (!this._content) {
      this.$el.html(template());
      this._content = this.$('.js-content');
    } else {
      this._content.clear();
    }

    this._content.append(new this._view(this._viewOptions).render().el);

    setTimeout(function () {
      this._calculateHeight();
    }.bind(this));

    return this;
  },

  remove: function () {
    this.destroyScroll();
    Backbone.View.prototype.remove.apply(this, arguments);
  },

  clean: function () {
    this.trigger('clean');
    this.remove();
  }
});
