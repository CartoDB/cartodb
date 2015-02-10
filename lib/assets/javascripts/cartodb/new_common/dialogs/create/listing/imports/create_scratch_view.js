var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var ImportDefaultView = require('new_common/dialogs/create/listing/imports/import_default_view');
var UploadModel = require('new_dashboard/background_importer/upload_model');
var urls = require('new_common/urls_fn');
var DatasetsUrl = require('new_common/urls/user/datasets_model');

/**
 *  Create from scratch
 *
 *  - Create a new dataset from scratch
 *  - It will redirect user to the dataset view
 *
 */

module.exports = ImportDefaultView.extend({

  events: {
    'click .js-create': '_createEmptyDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.userUrl = urls(window.config.account_host).userUrl(this.user);
    this.model = new UploadModel({ type: 'scratch' }, { user: this.user });
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/create_scratch');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        state: this.model.get('state')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  },

  _createEmptyDataset: function() {
    var self = this;
    var dataset = new cdb.admin.CartoDBTableMetadata();

    this.model.set('state', 'creating');

    dataset.save({}, {
      success: function(m) {
        window.location = new DatasetsUrl({ userUrl: self.userUrl }).toDataset(m);
      },
      error: function(m, e) {
        self.model.set('state', 'error');
      }
    });
  }

})