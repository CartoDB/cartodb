const IconSelectorView = require('dashboard/components/icon-selector/icon-selector-view');
const template = require('./avatar-selector.tpl');

module.exports = IconSelectorView.extend({
  options: {
    acceptedExtensions: ['jpeg', 'jpg', 'png', 'gif'],
    imageKind: 'orgavatar',
    imageURLAttribute: 'avatar_url'
  },

  render: function () {
    this._destroyFileInput();
    this.clearSubViews();

    this.$el.html(
      template({
        state: this._model.get('state'),
        name: this._renderModel.get('name'),
        inputName: this._renderModel.get('inputName'),
        avatarURL: this._renderModel.get('avatar_url'),
        username: this._renderModel.get('username'),
        avatarAcceptedExtensions: this._formatAcceptedExtensions(this.options.acceptedExtensions)
      })
    );

    this._renderFileInput();
    return this;
  }
});
