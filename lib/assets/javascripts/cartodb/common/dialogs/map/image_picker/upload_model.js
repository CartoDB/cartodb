var Backbone = require('backbone-cdb-v3');
var Utils = require('cdb.Utils');
var moment = require('moment-v3');
var _ = require('underscore-cdb-v3');

/**
 * Model that let user upload files to our endpoints.
 *
 * NOTE: this model extends Backbone.Model instead of cdb.core.Model, because it's required for the
 * vendor/backbone-model-file-upload.
 */
module.exports = Backbone.Model.extend({

  url: function(method) {
    var version = cdb.config.urlVersion('asset', method);
    return '/api/' + version + '/users/' + this.userId + '/assets'
  },

  fileAttribute: 'filename',

  defaults: {
    type: '',
    value: '',
    interval: 0,
    progress: 0,
    state: 'idle',
    option: ''
  },

  initialize: function(val, opts) {
    this.user = opts && opts.user;

    if (!opts.userId) {
      throw new Error('userId is required');
    }

    this.userId = opts.userId;

    this._initBinds();
    this._validate(this.attributes, { validate: true });
  },

  isValidToUpload: function() {
    return this.get('value') && this.get('state') !== 'error';
  },

  setFresh: function(attributes) {
    this.clear();
    this.set(attributes);
  },

  _initBinds: function() {
    this.bind('progress', function(progress) {
      this.set({
        progress: progress*100,
        state: 'uploading'
      });
    }, this);

    this.bind('change:value', function() {
      if (this.get('state') === "error") {
        this.set({ state: 'idle' })
        this.unset('get_error_text', { silent: true });
      }
    }, this);

    this.bind('error invalid', function(m, d) {
      this.set({
        state: 'error',
        error_code: (d && d.error_code) || '',
        get_error_text: {
          title: 'Invalid import',
          what_about: (d && d.msg) || ''
        }
      }, { silent: true });
      // We need this, if not validate will run again and again and again... :(
      this.trigger('change');
    }, this);
  },

  validate: function(attrs) {
    if (!attrs) return;

    if (attrs.type === "file") {
      // Number of files
      if (attrs.value && attrs.value.length) {
        return {
          msg: "Unfortunately only one file is allowed per upload"
        }
      }
      // File extension
      var name = attrs.value.name;
      var ext = name.substr(name.lastIndexOf('.') + 1);
      if (ext) {
        ext = ext.toLowerCase();
      }
      if (!_.contains(["jpg", "png", "gif", "svg"], ext)) {
        return {
          msg: "Unfortunately this file extension is not allowed"
        }
      }
    }

    if (attrs.type === "url") {
      // Valid URL?
      if (!Utils.isURL(attrs.value)) {
        return {
          msg: "Unfortunately the URL provided is not valid"
        }
      }
    }

  },

  isValid: function() {
    return this.get('value') && this.get('state') !== "error"
  },

  upload: function() {
    var self = this;

    var options = {
      kind: this.get('kind')
    };

    if (this.get('type') === "file") {
      options.filename = this.get('value');
    } else if (this.get('type') === "url") {
      options.url = this.get('value');
    }

    this.xhr = this.save(options, {
      success: function(m) {
        m.set('state', 'uploaded');
      },
      error: function(m, msg) {

        var message = 'Unfortunately there was a connection error';

        if (msg && msg.status === 429) {
          var response = JSON.parse(msg.responseText);
          message = response.error;
        } else if (msg && msg.status === 400) {
          var response = JSON.parse(msg.responseText);
          message = response.error;
        }

        self.set({
          state: 'error',
          get_error_text: { title: 'There was an error', what_about: message }
        });

      },
      complete: function() {
        delete self.xhr;
      }
    });
  },

  stopUpload: function() {
    if (this.xhr) this.xhr.abort();
  }
});
