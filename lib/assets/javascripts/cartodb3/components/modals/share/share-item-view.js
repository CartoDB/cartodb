var _ = require('underscore');
var CoreView = require('backbone/core-view');
var Clipboard = require('clipboard');
var template = require('./share-item.tpl');
var browserDetect = require('../../../helpers/browser-detect');
var TYPES = ['get-link', 'embed', 'cartodbjs', 'mobile-sdk'];

module.exports = CoreView.extend({
  className: 'Card',
  tagName: 'li',

  events: {
    'click .js-foo': '_onCopyClick'
  },

  initialize: function (opts) {
    if (!opts.type) throw new Error('type is required');
    if (_.indexOf(TYPES, opts.type) < 0) throw new Error('type must be one of these: ' + TYPES.join(', '));
    if (!opts.content) throw new Error('content is required');

    this._type = opts.type;
    this._content = opts.content;
    this._url = opts.url;

    this._body = _t('components.modals.share.' + this._type + '.body');
    this._title = _t('components.modals.share.' + this._type + '.title');
    this._link = _t('components.modals.share.' + this._type + '.link');
    this._copy = this._getButtonLabel();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._html();
    this._initClipboard();
    return this;
  },

  _getButtonLabel: function () {
    var browser = browserDetect();
    var label = _t('components.modals.share.' + this._type + '.copy');
    if (browser.name === 'Safari') {
      label = _t('components.modals.share.' + this._type + '.select');
    }

    return label;
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
      copy: this._copy,
      url: this._url
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

  clean: function () {
    this._clipboard.destroy();
    CoreView.prototype.clean.call(this);
  }
});
