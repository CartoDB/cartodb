var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var UploadModel = require('../../../upload_model');

/**
 *  Create from scratch
 *
 *  - Create a new dataset from scratch
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-create': '_createEmptyDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.model = new UploadModel({ type: 'scratch' }, { user: this.user });
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/create_scratch');
  },

  render: function() {
    this.$el.html(this.template({ type: this.createModel.get('type') }));
    return this;
  },

  _createEmptyDataset: function() {
    this.createModel.createDataset();
  }

})
