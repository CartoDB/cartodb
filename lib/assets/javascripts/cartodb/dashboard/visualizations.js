
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

  /*
    TODO list:

      - Order list by created_at / updated_at.
      - Create a new visualization from the scratch.
      - Compress the list.
      - When delete a visualization show the red block.
      - Show loader when load visualizations.
      - Specs.
  */

  cdb.admin.dashboard.Visualizations = cdb.core.View.extend({

    events: {
      'click a.create_new':   '_createNewVis',
      'click aside a.create': '_createNewVis'
    },

    initialize: function() {

      _.bindAll(this, "_changeTitle");

      this.tables = this.options.tables;
      this.visualizations = this.options.visualizations;

      this.$no_vis_view = this.$('article.no_vis');           // No visualization block
      this.$vis_list_view = this.$('article.visualizations'); // Vis block

      this.model = new Backbone.Model({
        show_default_title: true,
        default_title: "Recent visualizations"
      });

      this.model.on("change:show_default_title", this._changeTitle, this);

      this._initViews();
      this._bindEvents();
    },

    _initViews: function() {
      // Visualizations list
      this.vis_list = new cdb.admin.dashboard.VisualizationsList({
        el:         this.$('article.visualizations ul#vislist'),
        collection: this.visualizations,
        tables:     this.tables
      });

      this.addView(this.vis_list);
    },

    _bindEvents: function() {
      this.visualizations.bind('add reset', this._setupVisualizationView, this);
      this.visualizations.bind('remove', this._onRemove, this);
      this.tables.bind('add remove reset', this._decideActiveBlock, this);
    },

    _onRemove: function() {
      this.visualizations.fetch();
    },

    /**
     *  Setup visualization view when collection changes
     */
    _setupVisualizationView: function() {
      this._decideActiveBlock();
      this._changeTitle();
    },

    /**
     *  Decide which visualization block active
     */
    _decideActiveBlock: function() {
      var visualizations = _.filter(this.visualizations.models, function(vis) { return vis.get("type") == "derived" }).length
        , tables = this.tables.size()
        , active = visualizations > 0;

      this.$el[ tables == 0 ? 'addClass' : 'removeClass' ]('hide');
      this.$vis_list_view[ active ? 'addClass' : 'removeClass' ]('active');
      this.$no_vis_view[ !active ? 'addClass' : 'removeClass' ]('active');
    },

    showDefaultTitle: function(show) {
      this.model.set("show_default_title", show);
    },

    /**
    *  Change visualizations count title
    */
    _changeTitle: function() {

      if (this.model.get("show_default_title")) {
        this.$("article.visualizations h2").text(this.model.get("default_title"));
      } else {
        var count = _.filter(this.visualizations.models, function(vis) { return vis.get("type") == "derived" }).length;
        this.$("article.visualizations h2").text(count + " visualization" + ( count != 1 ? "s" : "") + " created");
      }

    },

    /**
     *  Open new visualization dialog
     */
    _createNewVis: function(e) {
      this.killEvent(e);
      // Open popup
    }
  });
