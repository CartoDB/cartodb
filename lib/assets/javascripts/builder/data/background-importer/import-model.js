var _ = require('underscore');
var Backbone = require('backbone');
var ImportModelPoller = require('./import-model-poller');
var SynchronizationModel = require('builder/data/synchronization-model');

/**
 *  New import model that controls
 *  the state of an import
 *
 */
module.exports = Backbone.Model.extend({

  idAttribute: 'item_queue_id',

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this._initBinds();
    this.poller = new ImportModelPoller(this);
  },

  urlRoot: function () {
    var version = this._configModel.urlVersion('import');
    var baseUrl = this._configModel.get('base_url');

    return baseUrl + '/api/' + version + '/imports';
  },

  _initBinds: function () {
    this.bind('change:item_queue_id', this._checkQueueId, this);
  },

  createImport: function (data) {
    var d = this._prepareData(data);
    this[d.interval === 0 ? '_createRegularImport' : '_createSyncImport'](d);
  },

  _checkQueueId: function () {
    if (this.get('item_queue_id')) {
      this.pollCheck();
    }
  },

  _prepareData: function (data) {
    var d = {
      create_vis: data.create_vis,
      privacy: data.privacy
    };

    var type = data.type;

    if (type !== 'remote') {
      _.extend(d, {
        type_guessing: data.type_guessing,
        content_guessing: data.content_guessing,
        interval: data.interval
      });
    }

    var service = data.service_name;

    if (type === 'url') {
      _.extend(d, {
        url: data.value
      });
    }

    if (type === 'remote') {
      _.extend(d, {
        type: 'remote',
        interval: null,
        remote_visualization_id: data.remote_visualization_id,
        create_vis: false,
        value: data.value
      });
    }

    if (type === 'sql') {
      _.extend(d, {
        table_name: data.table_name,
        sql: data.value
      });
    }

    if (type === 'duplication') {
      _.extend(d, {
        table_name: data.table_name,
        table_copy: data.value
      });
    }

    if (type === 'service') {
      // If service is Twitter, service_item_id should be
      // sent stringified
      var service_item_id = (service === 'twitter_search') ? JSON.stringify(data.service_item_id) : data.service_item_id;

      if (data.user_defined_limits) {
        d.user_defined_limits = data.user_defined_limits;
      }

      _.extend(d, {
        value: data.value,
        service_name: data.service_name,
        service_item_id: service_item_id
      });
    }

    return d;
  },

  _createSyncImport: function (d) {
    var self = this;
    this._synchronizationModel = new SynchronizationModel(d, {
      configModel: this._configModel
    });

    this._synchronizationModel.save(null, {
      success: function (m) {
        self.set('item_queue_id', m.get('data_import').item_queue_id);
      },
      error: function (mdl, r, opts) {
        self._setErrorState(r);
      }
    });
  },

  _createRegularImport: function (d) {
    var self = this;

    this.save(d, {
      error: function (mdl, r, opts) {
        self._setErrorState(r);
      }
    });
  },

  _setErrorState: function (r) {
    var msg;
    try {
      msg = r && JSON.parse(r.responseText).errors.imports;
    } catch (err) {
      msg = _t('data.import-model.error-starting-import');
    }
    this.set({
      state: 'failure',
      get_error_text: {
        title: _t('data.import-model.error-title'),
        what_about: msg
      }
    });
  },

  pollCheck: function () {
    this.poller.start();
  },

  destroyCheck: function () {
    this.poller.stop();
  }
});
