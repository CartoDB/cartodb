var _ = require('underscore');
var Backbone = require('backbone');
var Utils = require('builder/helpers/utils');

require('backbone-model-file-upload');

module.exports = Backbone.Model.extend({
  fileAttribute: 'filename',

  defaults: {
    type: '',
    filename: '',
    interval: 0,
    progress: 0,
    state: 'idle',
    option: ''
  },

  _initBinds: function () {
    this.bind('progress', function (progress) {
      this.set({
        progress: progress * 100,
        state: 'uploading'
      });
    }, this);

    this.bind('change:filename change:url', function () {
      if (this.get('state') === 'error') {
        this.set({ state: 'idle' });
        this.unset('get_error_text', { silent: true });
      }
    }, this);

    this.bind('error invalid', function (m, d) {
      this.set({
        state: 'error',
        error_code: (d && d.error_code) || '',
        get_error_text: {
          title: _t('componentes.data.asset-model.invalid-import'),
          what_about: (d && d.msg) || ''
        }
      }, { silent: true });
      // We need this, if not validate will run again and again and again... :(
      this.trigger('change');
    }, this);
  },

  validate: function (attrs) {
    if (!attrs) {
      return;
    }

    if (attrs.type === 'filename') { // Number of files
      if (attrs.filename && attrs.filename.length) {
        return {
          msg: _t('componentes.data.asset-model.one-file-per-upload')
        };
      }
      // File extension
      var name = attrs.filename.name;
      var ext = name.substr(name.lastIndexOf('.') + 1);

      if (ext) {
        ext = ext.toLowerCase();
      }

      if (!_.contains(['jpg', 'png', 'gif', 'svg'], ext)) {
        return {
          msg: _t('componentes.data.asset-model.invalid-extension')
        };
      }
    }

    if (attrs.type === 'url') { // Valid URL?
      if (!Utils.isURL(attrs.url)) {
        return {
          msg: _t('componentes.data.asset-model.invalid-url')
        };
      }
    }
  },

  isValid: function () {
    return (this.get('filename') || this.get('url')) && this.get('state') !== 'error';
  },

  upload: function () {
    var self = this;

    var options = {
      kind: this.get('kind')
    };

    if (this.get('type') === 'file') {
      options.filename = this.get('filename');
    } else if (this.get('type') === 'url') {
      options.filename = this.get('filename');
    }

    this.xhr = this.save(options, {
      success: function (m) {
        m.set('state', 'uploaded');
      },

      error: function (m, msg) {
        var response;
        var message = _t('componentes.data.asset-model.connection-error');

        if (msg && msg.status === 429) {
          response = JSON.parse(msg.responseText);
          message = response.error;
        } else if (msg && msg.status === 400) {
          response = JSON.parse(msg.responseText);
          message = response.error;
        }

        self.set({
          state: 'error',
          get_error_text: { title: _t('componentes.data.asset-model.error'), what_about: message }
        });
      },

      complete: function () {
        delete self.xhr;
      }
    });
  },

  stopUpload: function () {
    if (this.xhr) this.xhr.abort();
  }
});
