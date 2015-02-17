var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var CreateModel = require('new_common/dialogs/create/create_model');
var CreateContent = require('new_common/dialogs/create/create_content');


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

    this.model = new CreateModel({
      type: this.options.type
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/dialog_template');
  },

  render: function() {
    this.elder('render');
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initViews: function() {
    var createContent = new CreateContent({
      el: this.$el,
      model: this.model,
      user: this.user
    });
    createContent.bind('datasetSelected', this._onDatasetSelected, this);
    createContent.bind('remoteSelected', this._onRemoteSelected, this);
    createContent.bind('createMap', this._onCreateMap, this);
    createContent.render();
    this.addView(createContent);
  },

  _onDatasetSelected: function() {
    this.trigger('datasetSelected', this.model.getUpload(), this);
    this.trigger('done');
    this.close();
  },

  _onRemoteSelected: function(d) {
    this.trigger('remoteSelected', d, this);
    this.trigger('done');
    this.close();
  },

  _onCreateMap: function() {
    var selectedDatasets = this.model.getSelectedDatasets();

    var datasets = _.compact(
      _.map(selectedDatasets,function(m) {
        if (m.id && m.table.name) {
          return m.table.name;
        }
        return false;
      })
    );

    var vis = new cdb.admin.Visualization();
    vis.save({ name: 'untitled map', tables: datasets }).success(function() {
      window.location.href = vis.viewUrl();
    });
  }

});
