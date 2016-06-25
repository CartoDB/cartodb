var _ = require('underscore');
var CoreView = require('backbone/core-view');
var Clipboard = require('clipboard');
var template = require('./share-item.tpl');

var TYPES = ['get-link', 'embed', 'cartodbjs', 'mobile-sdk'];

module.exports = CoreView.extend({
  className: 'Card',
  tagName: 'li',

  events: {
    'click .js-foo': '_onCopyClick',
    'click .js-link': '_onLinkClick'
  },

  initialize: function (opts) {
    if (!opts.type) throw new Error('type is required');
    if (_.indexOf(TYPES, opts.type) < 0) throw new Error('type must be one of these: ' + TYPES.join(', '));
    if (!opts.content) throw new Error('content is required');

    this._type = opts.type;
    this._content = opts.content;

    this._body = _t('components.modals.share.' + this._type + '.body');
    this._title = _t('components.modals.share.' + this._type + '.title');
    this._link = _t('components.modals.share.' + this._type + '.link');
    this._copy = _t('components.modals.share.' + this._type + '.copy');
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._html();
    this._initClipboard();
    return this;
  },

  getValue: function () {
    return this.$('.js-input').val();
  },

  _html: function () {
    var view = template({
      id: this.cid,
      icon: this.options.icon || '',
      type: this._type,
      title: this._title,
      body: this._body,
      content: this._content,
      link: this._link,
      copy: this._copy
    });

    this.$el.append(view);
  },

  _initClipboard: function () {
    if (this._clipboard) {
      this._clipboard.destroy();
    }

    var btn = this.$('.js-copy');
    this._clipboard = new Clipboard(btn.get(0));
  },

  _onLinkClick: function (e) {
    this.killEvent(e);
    this.options.onLinkClick && this.options.onLinkClick();
  },

  clean: function () {
    this._clipboard.destroy();
    CoreView.prototype.clean.call(this);
  }
});
