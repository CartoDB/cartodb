var _ = require('underscore');
var UploadConfig = require('dashboard/common/upload-config');
var UploadModel = require('builder/data/upload-model');
var Utils = require('builder/helpers/utils.js');
var moment = require('moment');

module.exports = UploadModel.extend({
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
  }
});
