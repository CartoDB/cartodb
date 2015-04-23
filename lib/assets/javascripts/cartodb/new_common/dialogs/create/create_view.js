var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var CreateModel = require('./create_model');
var CreateContent = require('./create_content');
var MapTemplates = require('../../map_templates');

/**
 *  Create view dialog
 *
 *  It let user create a new dataset or map, just
 *  decide the type before creating this dialog, by default
 *  it will help you to create a map.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog is-opening CreateDialog',

  initialize: function() {
    this.elder('initialize');

    this.user = this.options.user;
    this.selectedDatasets = this.options.selectedItems;

    this.model = new CreateModel({
      type: this.options.type
    }, {
      selectedDatasets: this.selectedDatasets,
      user: this.user
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/dialog_template');
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initBinds: function() {
    this.model.bind('mapCreated', this._onMapCreated, this);
    this.model.bind('datasetCreated', this._onDatasetCreated, this);
  },

  _initViews: function() {
    var createContent = new CreateContent({
      el: this.$el,
      model: this.model,
      user: this.user
    });
    createContent.bind('start', this._onStart, this);
    createContent.bind('datasetSelected', this._onDatasetSelected, this);
    createContent.bind('remoteSelected', this._onRemoteSelected, this);
    createContent.bind('createMap', this._onCreateMap, this);
    createContent.render();
    this.addView(createContent);

    this._onStartCreate();
  },

  _onStartCreate: function() {
    // Seletected datasets?
    if (this.selectedDatasets && this.selectedDatasets.length > 0) {
      this.model.createMap();
    }

    // Preview map from the beginning?
    if (this.options.previewMap) {
      // Find map template
      var videoId = this.options.previewMap;
      var template = _.find(MapTemplates, function(m) {
        return m.video.id === videoId
      });
      if (template) {
        this.model.setMapTemplate(new cdb.core.Model(template));
      }
    }
  },

  _onStart: function() {
    this._doneAndClose();
    this.trigger('start', this.model, this);
  },

  _onDatasetSelected: function() {
    this.trigger('datasetSelected', this.model.getUpload(), this);
    this._doneAndClose();
  },

  _onRemoteSelected: function(d) {
    this.trigger('remoteSelected', d, this);
    this._doneAndClose();
  },

  _onDatasetCreated: function(m) {
    this.trigger('datasetCreated', m, this);
  },

  _onMapCreated: function(vis) {
    this.trigger('mapCreated', vis, this);
  },

  _doneAndClose: function() {
    this.trigger('done');
    this.close();
  }

});
