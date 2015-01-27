var cdb = require('cartodb.js');
var ImportModel = require('new_dashboard/background_importer/import_model');
var UploadModel = require('new_dashboard/background_importer/upload_model');

/** 
 *
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    state: 'upload'
  },

  initialize: function(val, opts) {
    this.user = opts.user;
    this.upl = new UploadModel(val.upload, { user: this.user });
    this.imp = new ImportModel(val.import, { user: this.user });
    this._initBinds();
    this._checkStatus();
  },

  _initBinds: function() {
    this.bind('change:import', this._onImportChange, this);
    this.bind('change:upload', this._onUploadChange, this);

    this.imp.bind('change', function() {
      this.trigger('change:import');
      this.trigger('change');
    }, this);
    this.upl.bind('change', function() {
      this.trigger('change:upload');
      this.trigger('change');
    }, this)
  },

  _destroyBinds: function() {
    this.upl.unbind(null, null, this);
    this.imp.unbind(null, null, this); 
  },

  _onUploadChange: function(m, i) {
    var item_queue_id = this.upl.get('item_queue_id');
    
    if (item_queue_id) {
      this.imp.set('item_queue_id', item_queue_id);
    }
  },

  _onImportChange: function() {
    var item_queue_id = this.imp.get('item_queue_id');
    if (item_queue_id) {
      this.set({
        id: item_queue_id,
        state: 'import'
      });
    }
  },

  _checkStatus: function() {
    if (this.upl.get('type') === 'file') {
      this.upl.upload();
    } else if (!this.imp.get('item_queue_id') || this.upl.get('type') !== 'file') {
      this.set('state', 'import');
      this.imp.createImport(this.upl.toJSON());
    }
  },

  hasFailed: function() {
    if (this.get('state') === 'upload') {
      return this.upl.get('state') === 'error'
    } else {
      return this.imp.get('state') === 'failure'
    }
  },

  hasCompleted: function() {
    return this.imp && this.imp.get('state') === 'complete'
  },

  get: function (attr) {
    if (attr === "upload") return this.upl.toJSON();
    if (attr === "import") return this.imp.toJSON();

    return cdb.core.Model.prototype.get.call(this, attr);
  },

  toJSON: function() {
    return {
      state: this.get('state'),
      upload: this.upl.toJSON(),
      import: this.imp.toJSON()
    }
  }//,

  // clean: function() {
  //   this._destroyBinds();
  //   this.upl.clean();
  //   this.imp.clean();
  //   this.elder('clear');
  // }

});