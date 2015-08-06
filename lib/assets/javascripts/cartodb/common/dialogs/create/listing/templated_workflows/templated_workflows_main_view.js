var cdb = require('cartodb.js');
var ViewFactory = require('../../../../view_factory');
var randomQuote = require('../../../../view_helpers/random_quote');
var TmplWfwListView = require('./templated_workflows_list_view');
var TmplWfwFormsView = require('./templated_workflows_forms_view');
var VisTmplsCollection = require('./visualization_templates_collection');

/**
 *  Main templated workflows view
 *
 *  - It will contain all the necessary views for creating
 *    new visualizations following templated-workflows
 *
 */

module.exports = cdb.core.View.extend({

  className: 'TemplatedWorkflows',

  initialize: function() {
    this.user = this.options.user;
    // this.model is create_map_model
    this.collection = new VisTmplsCollection(); // Visualization templates collection
    // Contains info about the state of the workflow.
    this.workflowModel = this.model.getWorkflowModel(); 
    this._initBinds();
    this.collection.fetch();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.collection.bind('loading', function() {
      this._enablePane('loading');
    }, this);
    this.collection.bind('reset', function() {
      this._enablePane(this.collection.size() > 0 ? 'list' : 'no_results');
    }, this);
    this.collection.bind('error', function() {
      this._enablePane('error');
    }, this);
    this.workflowModel.bind('change:stepNumber change:state', function() {
      var step = this.workflowModel.getStepNumber();
      this._enablePane(step !== null ? 'forms' : 'list');
    }, this);
    this.add_related_model(this.workflowModel);
    this.add_related_model(this.collection);
  },

  _initViews: function() {
    // Tab pane
    this._panes = new cdb.ui.common.TabPane({
      el: this.$el
    });
    this.addView(this._panes);

    // Subheader (breadcrumb, create button,...) 
    // TODO!
    
    // Visualization templates List
    var list = new TmplWfwListView({
      model: this.model,
      collection: this.collection
    });
    list.bind('onSelect', function(mdl) {
      this.workflowModel.set('template', mdl);
    }, this);
    this._panes.addTab('list', list.render());

    // Error loading
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: "Sorry, something went wrong getting your templates."
      }).render()
    );

    // Loading (collection?)
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting available templates...',
        quote: randomQuote()
      }).render()
    );

    // Empty (collection?)
    this._panes.addTab('no_results',
      ViewFactory.createByTemplate('common/templates/no_results', {
        icon: 'iconFont-Map',
        title: 'There are no templates',
        msg: 'Conctact us in order to generate new templates under your instance'
      }).render()
    );

    // Forms
    var forms = new TmplWfwFormsView({
      model: this.workflowModel,
      user: this.user
    });
    this._panes.addTab('forms', forms.render());
    
    // Select proper state
    this._enablePane( this.collection.size() > 0 ? 'list' : 'loading' );
  },

  _enablePane: function(name) {
    this._panes && this._panes.active(name);
  }

});
