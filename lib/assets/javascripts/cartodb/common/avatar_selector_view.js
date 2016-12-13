var cdb = require('cartodb.js-v3');
var AssetModel = require('./asset_model.js')

/**
 *  Change and preview new user avatar
 *
 */

module.exports = cdb.core.View.extend({
  options: {
    avatarAcceptedExtensions: ['jpeg', 'jpg', 'png', 'gif']
  },

  initialize: function() {
    this.renderModel = this.options.renderModel;
    this.model = new cdb.core.Model({ state: 'idle' });
    this.template = cdb.templates.getTemplate('common/views/avatar_selector_view');
    this._initBinds();
  },

  render: function() {
    this._destroyFileInput();
    this.clearSubViews();

    this.$el.html(
      this.template({
        state: this.model.get('state'),
        name: this.renderModel.get('name'),
        inputName: this.renderModel.get('inputName'),
        avatarURL: this.renderModel.get('avatar_url'),
        avatarAcceptedExtensions: this._formatAvatarAcceptedExtensions(this.options.avatarAcceptedExtensions)
      })
    )
    this._renderFileInput();
    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onInputChange', '_onSuccess', '_onError');
    this.model.bind('change', this.render, this);
  },

  _destroyFileInput: function() {
    var $file = this.$(":file");
    $file.unbind('change', this._onInputChange, this);
    $file.filestyle('destroy');
  },

  _renderFileInput: function() {
    var $file = this.$(":file");
    var opts = { buttonText: 'Choose image' };
    
    // If we set disabled, no mather if it is true
    // or false, it turns into disabled
    if (this.model.get('state') === "loading") {
      opts.disabled = true
    }

    $file.filestyle(opts);
    $file.bind('change', this._onInputChange);
  },

  _onInputChange: function() {
    var file = this.$(":file").prop('files');
    var avatarUpload = new AssetModel(
      null, {
        userId: this.renderModel.get('id')
      }
    );

    avatarUpload.save({
      kind: 'orgavatar',
      filename: file
    }, {
      success: this._onSuccess,
      error: this._onError
    });

    // If we move "loading" state before starting the upload,
    // it would trigger a new render and "remove" file value :S 
    this.model.set('state', 'loading');
  },

  _onSuccess: function(m, d) {
    this.renderModel.set('avatar_url', d.public_url);
    this.model.set('state', 'success');
  },

  _onError: function() {
    this.model.set('state', 'error');
  },

  clean: function() {
    this._destroyFileInput();
    this.elder('clean');
  },

  _formatAvatarAcceptedExtensions: function(avatarAcceptedExtensions) {
    var formattedExtensions = [];

    for (var i = 0; i < avatarAcceptedExtensions.length; i++) {
      formattedExtensions[i] = "image/" + avatarAcceptedExtensions[i];
    }

    return formattedExtensions.join(",");
  }

});
