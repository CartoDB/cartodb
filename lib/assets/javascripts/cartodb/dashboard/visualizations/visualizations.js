
  /**
   *  Visualization block view, it encompasses...:
   *
   *  - Visualization list
   *  - Visualization aside (create new vis)
   *  - Visualization empty block
   *
   *  It needs:
   *
   *  - Tables collection
   *  - Visualizations collection
   */

  cdb.admin.dashboard.Visualizations = cdb.core.View.extend({

    events: {
      'click a.create_new':   '_createNewVis',
      'click aside a.create': '_createNewVis'
    },

    initialize: function() {
      this.visualizations = this.options.visualizations;
      this.router = this.options.router;
      this.template = cdb.templates.getTemplate('dashboard/views/visualizations');
      
      this.render();

      this._initViews();
      this._initBinds();
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    },

    _initViews: function() {
      // Visualizations list
      this.visList = new cdb.admin.dashboard.VisualizationsList({
        el:         this.$('#vislist'),
        user:       this.options.user,
        router:     this.options.router,
        collection: this.visualizations
      });
      this.addView(this.visList);

      // Sort controller
      var sort_controller = new cdb.admin.Sortable({
        what: "visualizations",
        items: this.visualizations
      });

      // this.visSortable.bind("fetch", function(order) {
      //   self._getVisualizations(false, { type: "derived", order: order });
      // });

      this.$("aside.right > div.content").append(sort_controller.render().el);
      this.addView(sort_controller);

      // Paginator
      var vis_paginator = new cdb.admin.DashboardPaginator({
        el: this.$(".paginator"),
        what: "visualizations",
        items: this.visualizations
      });

      vis_paginator.bind('goToPage', this._navigateTo, this);

      // Create vis button
      this.visAside = new cdb.admin.dashboard.Aside({
        el: this.$("aside")
      });
    },

    _initBinds: function() {
      this.visualizations.bind('add remove reset', this._hideLoader, this);
      this.router.model.bind('change', this._onRouterChange, this);

      this.add_related_model(this.visualizations);
      this.add_related_model(this.router.model);
    },

    // Setup visualization view when collection changes

    _onRouterChange: function(mdl, changes) {
      var params = this.router.model.attributes;

      if (params.model === "visualizations" && !changes.model) {
        this._showLoader();
      } else {
        this._hideLoader();
      }
    },

    _showLoader: function() {
      this.$(".loader").show();
    },

    _hideLoader: function() {
      this.$(".loader").hide();
    },

    _navigateTo: function(page) {
      var params = this.router.model.attributes;
      var action = ''; 
      var val = '';

      if (page) {
        page = page.replace(/\//g,'');
      } else {
        page = params.page;
      }

      if (params.tag || params.q) {
        action = params.tag ? 'tag' : 'search';
        val = params.tag || params.q;
      }

      var path = params.model + ( params.only_shared ? '/shared' : '' ) + ( action ? ('/' + action + '/' + val) : '' ) + ( '/' + page);
      this.router.navigate(path, { trigger: true });
    },

    // Open new visualization dialog
    _createNewVis: function(e) {
      this.killEvent(e);

      // Open popup
      var dlg = new cdb.admin.NewVisualizationDialog({
        user: this.options.user
      });

      dlg.appendToBody().open();
    }

  });
