var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  password: '',
  private: 'is-red'
};

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new TypeError('userModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');

    this._privacy = opts.visDefinitionModel.get('privacy');
    this._name = opts.visDefinitionModel.get('name');
    this._avatar = opts.userModel.get('avatar_url');
    this._mapcapsCollection = opts.mapcapsCollection;

    this._mapcapsCollection.on('reset', this.render, this);
    this.add_related_model(this._mapcapsCollection);
  },

  render: function () {
    var published = this._mapcapsCollection.length > 0
                    ? _t('components.modals.share.published', { when: moment(this._mapcapsCollection.first().get('created_at')).fromNow() })
                    : _t('components.modals.share.unpublished');

    this.clearSubViews();
    this.$el.html(template({
      cssClass: PRIVACY_MAP[this._privacy.toLowerCase()],
      privacy: this._privacy,
      name: this._name,
      published: published,
      avatar: this._avatar
    }));
    return this;
  }

});
