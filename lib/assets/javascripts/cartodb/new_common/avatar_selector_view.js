var cdb = require('cartodb.js');
var AssetModel = require('./asset_model.js')

/**
 *  Change and preview new user avatar
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.renderModel = this.options.renderModel;
    this.model = new cdb.core.Model({ state: 'idle' });
    this.template = cdb.templates.getTemplate('new_common/views/avatar_selector_view');
    this._initBinds();
  },

  render: function() {
    this._destroyFileInput();
    this.clearSubViews();
    this.$el.html(
      this.template({
        state: this.model.get('state'),
        name: this.renderModel.get('name'),
        avatarURL: this.renderModel.get('avatar_url')
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
    $file.filestyle({
      buttonText: "Choose avatar"
    });
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

    this.model.set('state', 'loading');
  },

  _onSuccess: function(m, d) {
    // Set user avatar_url
    this.renderModel.set('avatar_url', d.public_url);
    // Change model state
    this.model.set('state', 'success');
  },

  _onError: function() {
    this.model.set('state', 'error');
  },

  clean: function() {
    this._destroyFileInput();
    this.elder('clean');
  }

});
