var CoreView = require('backbone/core-view');
var Clipboard = require('clipboard');
var template = require('./share-item.tpl');
var browserDetect = require('../../../helpers/browser-detect');

module.exports = CoreView.extend({
  className: 'Card',
  tagName: 'li',

  events: {
    'click .js-change-privacy': '_onChangePrivacyClick'
  },

  initialize: function (opts) {
    if (!opts.model) throw new Error('model is required');
    if (opts.isPublished == null) throw new Error('isPublished is required');

    this._isPublished = opts.isPublished;
    this._type = this.model.type();
    this._title = _t('components.modals.share.' + this._type + '.title');

    if (this.model.isPrivate()) {
      this._body = _t('components.modals.share.' + this._type + '.private.body');
    } else {
      this._body = _t('components.modals.share.' + this._type + '.body');
    }

    this._link = _t('components.modals.share.' + this._type + '.link');
    this._copy = this._getButtonLabel();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    if (!this.model.isPrivate() && this._isPublished) {
      this._initClipboard();
    }
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

  _initViews: function () {
    var view = template({
      id: this.cid,
      isPrivate: this.model.isPrivate(),
      type: this._type,
      title: this._title,
      body: this._body,
      content: this.model.content(),
      link: this._link,
      copy: this._copy,
      url: this.model.url(),
      isPublished: this._isPublished
    });

    this.$el.append(view);

    var iconTemplate = this.model.createIcon();
    this.$('.js-icon').append(iconTemplate());

    this.$el.toggleClass('is-disabled', !this._isPublished);
  },

  _initClipboard: function () {
    if (this._clipboard) {
      this._clipboard.destroy();
    }

    var btn = this.$('.js-copy');
    this._clipboard = new Clipboard(btn.get(0));
  },

  _onChangePrivacyClick: function (e) {
    this.killEvent(e);
    this.options.onChangePrivacy && this.options.onChangePrivacy();
  },

  clean: function () {
    this._clipboard && this._clipboard.destroy();
    CoreView.prototype.clean.call(this);
  }
});
