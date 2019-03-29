require('dragster');
var Dropzone = require('dropzone');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Utils = require('builder/helpers/utils');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var AssetsCollection = require('builder/data/assets-collection');
var template = require('./upload-assets-tab.tpl');

var REQUIRED_OPTS = [
  'configModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Form-modal',

  events: {
    'keyup .js-url': '_onURLChanged',
    'click .js-submit': '_onClickSubmit'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._stateModel = new Backbone.Model({
      status: 'show',
      uploads: 0
    });

    this.listenTo(this._stateModel, 'change:status', this.render);

    this._assetCollection = new AssetsCollection(
      null, {
        configModel: this._configModel,
        userModel: this._userModel
      }
    );
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());
    this._initDropzone();

    return this;
  },

  _initDropzone: function () {
    var el = $('html')[0];
    var self = this;

    this.dragster = new Dragster(el); // eslint-disable-line

    $(el).bind('dragster:enter', function (e) {
      self._showDropzone();
    });

    $(el).bind('dragster:leave', function (e) {
      self._hideDropzone();
    });

    if (el.dropzone) { // avoid loading the dropzone twice
      return;
    }

    this.dropzone = new Dropzone(el, {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });

    this.dropzone.on('dragover', function () {
      self._showDropzone();
    });

    this.dropzone.on('drop', function (e) {
      self.trigger('upload-files', e.dataTransfer.files);
      self._hideDropzone();
    });
  },

  _showDropzone: function () {
    this.$('.Form-upload').addClass('is-dropping');
  },

  _hideDropzone: function () {
    this.$('.Form-upload').removeClass('is-dropping');
  },

  _destroyDropzone: function () {
    var el = $('html')[0];

    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
      $(el).unbind('dragster:enter dragster:leave');
    }

    if (this.dropzone) {
      this.dropzone.destroy();
    }
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _onClickSubmit: function (e) {
    this.killEvent(e);

    var url = this._getURL();

    if (!url) {
      this._hideURLError();
      return;
    } else if (!Utils.isURL(url)) {
      this._showURLError();
      return;
    } else {
      this._hideURLError();
    }

    this.trigger('upload-url', url);
  },

  _getURL: function () {
    return this.$('.js-url').val();
  },

  _onURLChanged: function () {
    var url = this._getURL();

    if (!url) {
      this._hideURLError();
    } else if (!Utils.isURL(url)) {
      this._showURLError();
    } else {
      this._hideURLError();
    }
  },

  _showURLError: function () {
    this.$('.js-url-error').addClass('is-visible');
  },

  _hideURLError: function () {
    this.$('.js-url-error').removeClass('is-visible');
  },

  clean: function () {
    this._destroyDropzone();
    CoreView.prototype.clean.apply(this);
  }
});
