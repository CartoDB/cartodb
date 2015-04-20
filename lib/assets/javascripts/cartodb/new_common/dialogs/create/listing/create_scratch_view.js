var cdb = require('cartodb.js');
var UploadModel = require('../../../background_importer/upload_model');

/**
 *  Create from scratch
 *
 *  - Create a new dataset from scratch
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-create': '_create'
  },

  _TEXTS: {
    title: {
      map: 'Create a new map from scratch',
      dataset: 'Create a new dataset from scratch',
      addLayer: 'Add an empty layer'
    },
    explanationOfSideEffects: {
      map: 'We will redirect you once it finishes',
      dataset: 'We will redirect you once it finishes',
      addLayer: 'An empty dataset will be created for the new layer, the new layer will be available once the dataset is created'
    },
    createButtonLabel: {
      map: 'Create map',
      dataset: 'Create dataset',
      addLayer: 'Add layer'
    }
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.model = new UploadModel({ type: 'scratch' }, { user: this.user });
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/create_scratch');
  },

  render: function() {
    var createModelType = this.createModel.get('type');

    this.$el.html(
      this.template({
        title: this._TEXTS.title[createModelType],
        explanationOfSideEffects: this._TEXTS.explanationOfSideEffects[createModelType],
        createButtonLabel: this._TEXTS.createButtonLabel[createModelType]
      })
    );
    return this;
  },

  _create: function() {
    this.createModel.createFromScratch();
  }

});
