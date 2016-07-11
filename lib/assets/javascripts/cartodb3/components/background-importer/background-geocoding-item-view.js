var CoreView = require('backbone/core-view');
var _ = require('underscore');
var Utils = require('cdb.Utils');
var GeocodingResultDetailsView = require('../geocoding/geocoding-result-details-view');
var template = require('./background-geocoding-item.tpl');
var Notifier = require('../../components/notifier/notifier');

/**
 *  Geocoding item within background polling
 *
 */
module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.importModel) throw new Error('importModel is required');

    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._importModel = opts.importModel;
    this._showGeocodingDatasetURLButton = opts.showGeocodingDatasetURLButton;

    this._notification = Notifier.addNotification({});

    this._initBinds();
  },

  _getStatus: function () {
    var status = 'loading';
    var failed = this._importModel.hasFailed();
    var completed = this._importModel.hasCompleted();

    if (failed) {
      status = 'error';
    } else if (completed) {
      status = 'success';
    }

    return status;
  },

  _getClosable: function () {
    var status = this._getStatus();
    var canCancel = _.isFunction(this._importModel.cancelGeocoding);

    if (status !== 'loading') {
      return true;
    } else {
      return canCancel;
    }
  },

  _getButton: function () {
    var failed = this._importModel.hasFailed();
    var completed = this._importModel.hasCompleted();
    var isLatLngType = this._importModel.get('latitude_column') && this._importModel.get('longitude_column');

    if (failed) {
      return _t('components.background-geocoding-item.show');
    } else if (completed && !isLatLngType) {
      return _t('components.background-geocoding-item.show');
    }

    return false;
  },

  _getInfo: function () {
    var processedRows = this._importModel.get('processed_rows') || 0;
    var processableRows = this._importModel.get('processable_rows') || 0;
    var realRows = this._importModel.get('real_rows') || 0;
    var isLatLngType = this._importModel.get('latitude_column') && this._importModel.get('longitude_column');

    var d = {
      realRows: realRows,
      tableName: this._importModel.get('table_name'),
      canCancel: _.isFunction(this._importModel.cancelGeocoding),
      hasFailed: this._importModel.hasFailed(),
      hasCompleted: this._importModel.hasCompleted(),
      processedRows: processedRows,
      processableRows: processableRows,
      processableRowsFormatted: Utils.formatNumber(processableRows),
      realRowsFormatted: Utils.formatNumber(realRows),
      width: realRows > 0 ? (processableRows / realRows).toFixed(0) : 100,
      isLatLngType: isLatLngType
    };

    return template(d);
  },

  updateNotification: function () {
    var data = {
      info: this._getInfo(),
      status: this._getStatus(),
      closable: this._getClosable(),
      button: this._getButton()
    };

    this._notification.update(data);
  },

  _initBinds: function () {
    this._importModel.bind('change', this.updateNotification, this);
    this._importModel.bind('remove', this.clean, this);
    this._notification.on('notification:close', this._closeHandler, this);
    this._notification.on('notification:action', this._showDetails, this);
    this.add_related_model(this._importModel);
    this.add_related_model(this._notification);
  },

  _closeHandler: function () {
    var status = this._getStatus();
    if (status !== 'loading') {
      this._removeGeocoding();
    } else {
      this._cancelGeocoding();
    }
  },

  _cancelGeocoding: function () {
    this._importModel.cancelGeocoding();
  },

  _removeGeocoding: function () {
    this.trigger('remove', this._importModel, this);
    this.clean();
  },

  _showDetails: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      return new GeocodingResultDetailsView({
        model: self._importModel,
        userModel: self._userModel,
        configModel: self._configModel,
        modalModel: modalModel,
        showGeocodingDatasetURLButton: self._showGeocodingDatasetURLButton
      });
    });
    modal.show();
  }
});
