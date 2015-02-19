var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var ImportDefaultView = require('new_common/dialogs/create/listing/imports/import_default_view');
var UploadModel = require('new_common/upload_model');

/**
 *  Create from scratch
 *
 *  - Create a new dataset from scratch
 *
 */

module.exports = ImportDefaultView.extend({

  events: {
    'click .js-create': '_createEmptyDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({ type: 'scratch' }, { user: this.user });
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/create_scratch');
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  },

  _createEmptyDataset: function() {
    this.trigger('createDataset', this);
  }

})