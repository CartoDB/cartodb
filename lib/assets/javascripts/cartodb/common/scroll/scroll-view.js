var Ps = require('perfect-scrollbar');
var MutationObserver = window.MutationObserver;

var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  tagName: 'div',
  className: 'ScrollView',

  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('A factory createContentView function is required');
    this.options = opts || {};
    this._type = opts.type || 'vertical'; // vertical or horizontal
    this._maxScroll = 0;

    this.template = cdb.templates.getTemplate('common/scroll/scroll');
  },

  render: function () {
    this.clearSubViews();
    this._html();

    var view = this.options.createContentView.call(this);
    this._contentContainer().append(view.render().el);
    this.addView(view);
    this._applyScroll();
    this._updateScrollWhenExist();
    return this;
  },

  _html: function () {
    this.$el.html(this.template({
      type: this._type
    }));

    (this._type === 'horizontal') && this.$el.addClass('ScrollView--horizontal');
  },

  _contentContainer: function () {
    return this.$('.js-content');
  },

  _wrapperContainer: function () {
    return this.$('.js-wrapper');
  },

  _updateScrollWhenExist: function () {
    // Phantom doesn't provide this api for window.
    if (!MutationObserver) return;

    // even with the changes in PS, we need to check when this element is added to the dom
    // in order to trigger manually an update.
    var element = document.body;
    var self = this._wrapperContainer().get(0);
    var onMutationObserver = function () {
      if (element.contains(self)) {
        Ps.update(self);
        observer.disconnect();
      }
    };

    var observer = new MutationObserver(onMutationObserver);
    onMutationObserver();

    var config = { subtree: true, childList: true };
    observer.observe(element, config);
  },

  _applyScroll: function () {
    Ps.initialize(this._wrapperContainer().get(0), {
      wheelSpeed: 2,
      wheelPropagation: true,
      stopPropagationOnClick: false,
      minScrollbarLength: 20,
      suppressScrollX: this._type === 'vertical',
      suppressScrollY: this._type === 'horizontal'
    });
  },

  destroyScroll: function () {
    Ps.destroy(this._wrapperContainer().get(0));
  },

  clean: function () {
    this.destroyScroll();
    cdb.core.View.prototype.clean.call(this);
  }
});
