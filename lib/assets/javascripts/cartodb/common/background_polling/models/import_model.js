var cdb = require('cartodb.js');
var cdbAdmin = require('cdb.admin');
var ImportModelPoller = require('./import_model_poller');

/**
 *  New import model that controls
 *  the state of an import
 *
 */
module.exports = cdb.core.Model.extend({

  url: function(method) {
    var version = cdb.config.urlVersion('import', method);
    var base = '/api/' + version + '/imports';

    if (this.isNew()) {
      return base;
    }
    return base + '/' + this.id;
  },

  idAttribute: 'item_queue_id',

  initialize: function() {
    this._initBinds();
    this.poller = new ImportModelPoller(this);
  },

  _initBinds: function() {
    this.bind('change:item_queue_id', this._checkQueueId, this);
  },

  createImport: function(data) {
    var d = this._prepareData(data);
    this[data.interval === 0 ? '_createRegularImport' : '_createSyncImport'](d);
  },

  _checkQueueId: function() {
    if (this.get('item_queue_id')) {
      this.pollCheck();
    }
  },

  _prepareData: function(data) {
    var d = {
      create_vis: data.create_vis
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

    // Url?
    if (type === "url") {
      _.extend(d, {
        url: data.value
      });
    }

    // Remote?
    if (type === "remote") {
      _.extend(d, {
        type: "remote",
        interval: null,
        remote_visualization_id: data.remote_visualization_id,
        create_vis: false,
        value: data.value
      });
    }

    // Service?
    if (type === "service") {
      // If service is Twitter, service_item_id should be
      // sent stringified
      var service_item_id = (service === "twitter_search")
          ? JSON.stringify(data.service_item_id)
          : data.service_item_id;

      // User defined limits?
      if (data.user_defined_limits) {
        d.user_defined_limits = data.user_defined_limits;
      }

      _.extend(d, {
        value:            data.value,
        service_name:     data.service_name,
        service_item_id:  service_item_id
      });
    }

    return d;
  },

  _createSyncImport: function(d) {
    var self = this;
    // Create synchronization model
    var sync = new cdbAdmin.TableSynchronization(d);

    sync.save(null, {
      success: function(m) {
        self.set('item_queue_id', m.get('data_import').item_queue_id);
      },
      error: function() {
        self.set(
          'get_text_error',
          {
            title: 'There was an error',
            what_about: 'Unfortunately there was an error creating the synchronization'
          }
        );
      }
    });
  },

  _createRegularImport: function(d) {
    var self = this;

    this.save(d, {
      error: function() {
        self.set(
          'get_text_error',
          {
            title: 'There was an error',
            what_about: 'Unfortunately there was an error starting the import'
          }
        );
      }
    });
  },

  pollCheck: function() {
    this.poller.start();
  },

  destroyCheck: function() {
    this.poller.stop();
  }

});
