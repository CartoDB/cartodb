var _ = require('underscore');
var Backbone = require('backbone');
var UploadConfig = require('builder/config/upload-config');
var Utils = require('builder/helpers/utils.js');
var moment = require('moment');
require('backbone-model-file-upload');

/**
 * Model that allows uploading files to CartoDB endpoints.
 *
 * NOTE: this model extends Backbone.Model instead of Backbone.Model, because
 * it's required for the vendor/backbone-model-file-upload.
 */
module.exports = Backbone.Model.extend({
  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/imports';
  },

  fileAttribute: 'filename',

  defaults: {
    type: '',
    value: '',
    interval: 0,
    privacy: '',
    progress: 0,
    state: 'idle',
    service_item_id: '',
    service_name: '',
    option: '',
    content_guessing: true,
    type_guessing: true,
    create_vis: true
  },

  initialize: function (attrs, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._initBinds();
    // We need to validate entry attributes
    this._validate(this.attributes, { validate: true });
  },

  setUpload: function (d) {
    this.set(d, {
      validate: true
    });
  },

  isValidToUpload: function () {
    return this.get('value') && this.get('state') !== 'error';
  },

  setFresh: function (d) {
    if (d && !_.isEmpty(d)) {
      // Set upload properties except create_vis (defined when created)
      this.set(_.omit(d, 'create_vis'));
    } else {
      this.clear();
    }
  },

  _initBinds: function () {
    this.bind('progress', function (progress) {
      this.set({
        progress: progress * 100,
        state: 'uploading'
      });
    }, this);

    this.bind('change:value', function () {
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
          title: _t('data.upload-model.invalid-import'),
          what_about: (d && d.msg) || ''
        }
      });
    }, this);
  },

  validate: function (attrs) {
    if (!attrs) return;

    if (attrs.type === 'file') {
      // Number of files
      if (attrs.value && attrs.value.length) {
        return {
          msg: _t('data.upload-model.one-file')
        };
      }

      // File name
      var name = attrs.value.name;
      if (!name) {
        return {
          msg: _t('data.upload-model.file-defined')
        };
      }

      // File extension
      var ext = name.substr(name.lastIndexOf('.') + 1);
      if (ext) {
        ext = ext.toLowerCase();
      }
      if (!_.contains(UploadConfig.fileExtensions, ext)) {
        return {
          msg: _t('data.upload-model.file-extension')
        };
      }
      // File size
      if ((this._userModel.get('remaining_byte_quota') * UploadConfig.fileTimesBigger) < attrs.value.size) {
        return {
          msg: _t('data.upload-model.file-size'),
          error_code: 8001
        };
      }
    }

    if (attrs.type === 'remote') {
      // Valid remote visualization id?
      if (!attrs.remote_visualization_id) {
        return {
          msg: _t('data.upload-model.visualization-id')
        };
      }
      // Remote size?
      if (attrs.size && ((this._userModel.get('remaining_byte_quota') * UploadConfig.fileTimesBigger) < attrs.size)) {
        return {
          msg: _t('data.upload-model.remote-file-size'),
          error_code: 8001
        };
      }
    }

    if (attrs.type === 'url') {
      // Valid URL?
      if (!Utils.isURL(attrs.value)) {
        return {
          msg: _t('data.upload-model.url-invalid')
        };
      }
    }

    if (attrs.type === 'sql') {
      if (!attrs.value) {
        return {
          msg: _t('data.upload-model.query-undefined')
        };
      }
    }

    if (attrs.type === 'duplication') {
      if (!attrs.value) {
        return {
          msg: _t('data.upload-model.dataset-copy-undefined')
        };
      }
    }

    if (attrs.type === 'service' && attrs.service_name === 'twitter_search') {
      var service_item_id = attrs.service_item_id;

      // Empty?
      if (!service_item_id || _.isEmpty(service_item_id)) {
        return {
          msg: _t('data.upload-model.twitter-data')
        };
      }

      // Categories?
      if (_.isEmpty(service_item_id.categories)) {
        return {
          msg: _t('data.upload-model.twitter-categories-invalid')
        };
      }

      // Dates?
      var dates = service_item_id.dates;
      if (!dates || _.isEmpty(dates)) {
        return {
          msg: _t('data.upload-model.twitter-dates-empty')
        };
      }
      var isToDateValid = moment(dates.fromDate) <= moment(new Date());
      if (!dates.fromDate || !dates.toDate || !isToDateValid) {
        return {
          msg: _t('data.upload-model.twitter-dates-invalid')
        };
      }
    }
  },

  isValid: function () {
    return this.get('value') && this.get('state') !== 'error';
  },

  upload: function () {
    if (this.get('type') === 'file') {
      var self = this;
      this.xhr = this.save(
        {
          filename: this.get('value')
        },
        {
          success: function (m) {
            m.set('state', 'uploaded');
          },
          error: function (m, msg) {
            var message = _t('data.upload-model.connection-error');

            if (msg && msg.status === 429) {
              var response = JSON.parse(msg.responseText);
              message = response.errors.imports;
            }

            self.set({
              state: 'error',
              get_error_text: {
                title: _t('data.upload-model.error-happened'),
                what_about: message
              }
            });
          },
          complete: function () {
            delete self.xhr;
          }
        }
      );
    }
  },

  stopUpload: function () {
    if (this.xhr) this.xhr.abort();
  },

  setGuessing: function (val) {
    this.set({
      type_guessing: val,
      content_guessing: val
    });
  },

  setPrivacy: function (val) {
    this.set('privacy', val);
  }

});
