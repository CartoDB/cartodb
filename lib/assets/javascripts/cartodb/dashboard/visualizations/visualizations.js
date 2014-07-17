
  /**
   *  Visualization block view, it encompasses...:
   *
   *  - Visualization list
   *  - Visualization aside (create new vis)
   *  - Visualization paginator
   *
   *  It needs:
   *
   *  - Visualizations collection
   *  - Router class
   *  - User model
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

      this.visList.bind('onVisRemoved', function() {
        this.trigger('onVisRemoved', this);
      }, this)

      this.addView(this.visList);

      // Sort controller
      var sort_visualizations = new cdb.admin.Sortable({
        what: "visualizations",
        items: this.visualizations
      });

      sort_visualizations.bind("sortChanged", this._onSortChanged, this);
      this.$("aside.right > div.content").append(sort_visualizations.render().el);
      this.addView(sort_visualizations);

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

    _initBinds: function() {},

    onScroll: function(ev) {
      this.visAside.scroll(ev);
    },

    _onSortChanged: function() {
      this.router.model.trigger('change', this.router.model, {});
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

      if (this.create_dialog) this.create_dialog.clean();

      // Open popup
      this.create_dialog = new cdb.admin.NewVisualizationDialog({
        user: this.options.user
      });

      this.create_dialog.appendToBody().open();
    },

    clean: function() {
      if (this.create_dialog) this.create_dialog.clean();
      cdb.core.View.prototype.clean.call(this);
    }

  });
