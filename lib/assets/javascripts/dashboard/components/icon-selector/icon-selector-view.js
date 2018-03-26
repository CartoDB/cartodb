const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const template = require('./icon-selector.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');
require('filestyle');

var AssetModel = require('dashboard/data/asset-model.js');

const REQUIRED_OPTS = [
  'configModel',
  'renderModel'
];

/**
 *  Change and preview new mobile app icon
 *
 */

module.exports = CoreView.extend({
  options: {
    acceptedExtensions: ['jpeg', 'jpg', 'png', 'gif'],
    imageKind: 'mobileAppIcon',
    imageURLAttribute: 'icon_url'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._model = new Backbone.Model({ state: 'idle' });
    this._initBinds();
  },

  render: function () {
    this._destroyFileInput();
    this.clearSubViews();

    this.$el.html(
      template({
        state: this._model.get('state'),
        name: this._renderModel.get('name'),
        inputName: this._renderModel.get('inputName'),
        iconURL: this._renderModel.get('icon_url'),
        iconAcceptedExtensions: this._formatAcceptedExtensions(this.options.acceptedExtensions)
      })
    );
    this._renderFileInput();
    return this;
  },

  _initBinds: function () {
    _.bindAll(this, '_onInputChange', '_onSuccess', '_onError');
    this.listenTo(this._model, 'change', this.render);
  },

  _destroyFileInput: function () {
    var $file = this.$(':file');
    $file.unbind('change', this._onInputChange, this);
    $file.filestyle('destroy');
  },

  _renderFileInput: function () {
    var $file = this.$(':file');
    var opts = { buttonText: 'Choose image' };

    // If we set disabled, no mather if it is true
    // or false, it turns into disabled
    if (this._model.get('state') === 'loading') {
      opts.disabled = true;
    }

    $file.filestyle(opts);
    $file.bind('change', this._onInputChange);
  },

  _onInputChange: function () {
    var file = this.$(':file').prop('files');
    var iconUpload = new AssetModel(
      null, {
        userId: this._renderModel.get('id'),
        configModel: this._configModel
      }
    );

    iconUpload.save({
      kind: this.options.imageKind,
      filename: file
    }, {
      success: this._onSuccess,
      error: this._onError
    });

    // If we move "loading" state before starting the upload,
    // it would trigger a new render and "remove" file value :S
    this._model.set('state', 'loading');
  },

  _onSuccess: function (model, data) {
    this._renderModel.set(this.options.imageURLAttribute, data.public_url);
    this._model.set('state', 'success');
  },

  _onError: function () {
    this._model.set('state', 'error');
  },

  clean: function () {
    this._destroyFileInput();
    CoreView.prototype.clean.apply(this);
  },

  _formatAcceptedExtensions: function (acceptedExtensions) {
    var formattedExtensions = [];

    for (var i = 0; i < acceptedExtensions.length; i++) {
      formattedExtensions[i] = 'image/' + acceptedExtensions[i];
    }

    return formattedExtensions.join(',');
  }

});
