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

    this._type = this.model.type();

    if (this.model.isPrivate()) {
      this._body = _t('components.modals.share.' + this._type + '.private.body');
      this._title = _t('components.modals.share.' + this._type + '.private.title');
    } else {
      this._body = _t('components.modals.share.' + this._type + '.body');
      this._title = _t('components.modals.share.' + this._type + '.title');
    }

    this._link = _t('components.modals.share.' + this._type + '.link');
    this._copy = this._getButtonLabel();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    if (!this.model.isPrivate()) {
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
      url: this.model.url()
    });

    this.$el.append(view);

    var iconTemplate = this.model.createIcon();
    this.$('.js-icon').append(iconTemplate());
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
