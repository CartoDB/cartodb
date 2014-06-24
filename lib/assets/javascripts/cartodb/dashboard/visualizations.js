
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
      this.template = cdb.templates.getTemplate('dashboard/views/visualizations');
      this.render();

      this._initViews();
      this._bindEvents();
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

      this.visList.bind("remove",     this._onRemove, this);
      this.visList.bind("showLoader", this.showLoader, this);

      this.addView(this.visList);
    },

    _bindEvents: function() {
      this.visualizations.bind('add reset', this._setupVisualizationView, this);
    },

    _onRemove: function() {
      this.trigger("removeVisualization", this);
    },

    /**
     *  Setup visualization view when collection changes
     */
    _setupVisualizationView: function() {
      this._decideActiveBlock();
      this.hideLoader();
    },

    showLoader: function() {
      this.$el.find(".loader").show();
    },

    hideLoader: function() {
      this.$el.find(".loader").hide();
    },

    /**
     *  Decide which visualization block active
     */
    _decideActiveBlock: function() {
      var visualizations = _.filter(this.visualizations.models, function(vis) { return vis.get("type") == "derived" }).length;

      if (visualizations > 0) {
        this.$el[ (visualizations > 0) ? 'addClass' : 'removeClass' ]('active');
        this.$el.removeClass("hidden");
      } else {
        this.$el.addClass("hidden");
      }

    },

    hide: function() {
      this.$el.removeClass("active");
    },

    /**
     *  Open new visualization dialog
     */
    _createNewVis: function(e) {
      this.killEvent(e);

      // Open popup
      var dlg = new cdb.admin.NewVisualizationDialog({
        user:       this.options.user
      });

      dlg.appendToBody().open();
    }

  });
