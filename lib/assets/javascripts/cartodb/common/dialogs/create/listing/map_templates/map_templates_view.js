var cdb = require('cartodb.js');
var ViewFactory = require('../../../../view_factory');
var randomQuote = require('../../../../view_helpers/random_quote');
// var TemplatedWorkflowsHeaderView = require('./templated_workflows_header_view');
// var TemplatedWorkflowsListView = require('./templated_workflows_list_view');

/**
 *  Map templates (workflows) view
 *
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
    this.model.getAvailableTemplates();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('loadingTemplates', function() {
      this._panes.active('loading');
    }, this);
    this.model.bind('resetTemplates', function() {
      if (this.model.getStep() === 0) {
        this._panes.active('list');
      }
    }, this);
    this.model.bind('errorTemplates', function() {
      if (this.model.getStep() === 0) {
        this._panes.active('error');
      }
    }, this);
  },

  _initViews: function() {

    // - OUT OF TAB PANE
    // Header (one step, two steps, bla bla bla)
    var headerView = new TemplatedWorkflowsHeaderView({
      el: this.$('.js-header'),
      collection: this.collection
    });
    headerView.render();

    // Footer -> Next, next, next, next... create
    // TODO!

    // - IN TAB PANE

    // Tab pane
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-panes')
    });
    this.addView(this._panes);

    // Subheader (breadcrumb, create button,...) 
    // TODO!
    
    // Visualization templates List
    var list = new TemplatedWorkflowsListView({
      model: this.model
    });
    this._panes.addTab('list', list.render());
    
    // Loading (collection?)
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting available templates...',
        quote: randomQuote()
      }).render()
    );

    // Error loading
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: "Sorry, something went wrong getting your templates."
      }).render()
    );

    // Steps (Forms)
    // TODO!
    
    // Visualization creation status
    // TODO!
    
    // Select proper state
    this._panes.active( this.model.getAvailableTemplates().size() > 0 ? 'list' : 'loading' );
    
  }

});
