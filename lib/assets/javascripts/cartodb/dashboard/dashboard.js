/**
 *  Entry point for dashboard
 */

$(function() {

  var Dashboard = cdb.core.View.extend({

    el: document.body,

    events: {},

    initialize: function() {
      this._initModels();
      this._initViews();
      this._initBindings();
    },

    _initBindings: function() {

      var self = this;

      _.bindAll(this, "_goto", "_whenScroll");

      $(document).on("scroll", this._whenScroll);

      $("header li a.tables, article.tables .view_all").on("click",                 function(e) { self._goto(e, "/tables"); });
      $("header li a.visualizations, article.visualizations .view_all").on("click", function(e) { self._goto(e, "/visualizations"); });
      $("header li a.dashboard").on("click",                                        function(e) { self._goto(e, ""); });

      $("body").on("click", "section.visualizations .tags a", function(e) {
        self._goto(e, "/visualizations/tag/" + $(e.target).attr("data-tag"));
      });

      $("body").on("click", "section.tables .tags a", function(e) {
        self._goto(e, "/tables/tag/" + $(e.target).attr("data-tag"));
      });

    },

    _initModels: function() {

      this.router         = this.options.router;

      this.user           = new cdb.admin.User(this.options.user_data);
      this.tables         = new cdb.admin.Visualizations({ type: "table" });
      this.visualizations = new cdb.admin.Visualizations({ type: "derived" });
      this.tags           = new cdb.admin.Tags();

      this.first_time = true;

      // The user model has to update every time the table model
      this.tables.bind('add remove reset', function(){
        if (!this.first_time)
          this.user.fetch();

        this.first_time = false;
      }, this);

      this.tables.bind('error', function(e) {
        cdb.log.info("error", e);
      });

      this.visualizations.bind("reset", function() {
        if (this.length == 0 && dashboard.tables.length == 0) {
          $("header ul .visualizations").addClass("disabled");
        }
        else {
          $("header ul .visualizations").removeClass("disabled");
        }
      });

    },

    _goto: function(e, where) {
      e && e.preventDefault();
      e && e.stopPropagation();

      if (e && $(e.target).hasClass("disabled")) return;

      this.router.navigate(where, { trigger: true });
    },

    _setupVisualizations: function() {

      var self = this;

      this.visualizationsView = new cdb.admin.dashboard.Visualizations({
        el:             this.$('article.visualizations'),
        user:           this.user,
        visualizations: this.visualizations,
        config:         this.options.config
      });

      this.visSortable = new cdb.admin.Sortable({
        what: "visualizations",
        items: this.visualizations
      });

      $("section.visualizations .head").append(this.visSortable.render().$el);

      this.visPaginator = new cdb.admin.DashboardPaginator({
        el: this.$("article.visualizations .paginator"),
        what: "visualizations",
        items: this.visualizations
      });

      this.visPaginator.bind('viewAll', function() {
        self._goto(null, "/visualizations");
      });

      this.visPaginator.bind('goToPage', function(page) {
        self._goto(null, page);
      });

      this.visualizationsView.bind("removeTag", function(e) {
        self.router.navigate("/", { trigger: true });
      }, this);

      // Create vis button
      this.visAside = new cdb.admin.dashboard.Aside({
        el: this.$el.find("article.visualizations aside")
      });

    },

    _setupTables: function() {

      var self = this;

      this.tablesView = new cdb.admin.dashboard.Tables({
        el:             this.$('article.tables'),
        tables:         this.tables,
        user:           this.user,
        config:         this.options.config,
        importer:       this.importer
      });

      // TODO: rename this thing
      var createTable = new cdb.admin.CreateTable({
        el:       $("body"),
        importer: this.importer,
        tables:   this.tables,
        model:    this.user,
        config:   this.options.config
      });

      // Refresh the list of visualizations when a table is removed
      this.tables.bind("remove", function() {
        dashboard.visualizations.fetch();
      }, this);

      this.tablesSortable = new cdb.admin.Sortable({
        what: "tables",
        items: this.tables
      });

      $("section.tables .head").append(this.tablesSortable.render().$el);

      this.tablesView.bind("removeTag", function(e) {
        self.router.navigate("/", { trigger: true });
      }, this);

      this.tablesPaginator = new cdb.admin.DashboardPaginator({
        el: this.$("article.tables .paginator"),
        what: "tables",
        items: this.tables
      });

      this.tablesPaginator.bind('viewAll', function() {
        self._goto(null, "/tables");
      });

      this.tablesPaginator.bind('goToPage', function(page) {
        self._goto(null, page);
      });

      // Create table button
      this.tableAside = new cdb.admin.dashboard.Aside({
        el: this.$el.find("article.tables aside")
      });

    },

    _setupTags: function() {

      var self = this;

      this.filterTag = new cdb.admin.TagDropdown({
        className:         'dropdown tag_dropdown border',
        target:            $(".filter"),
        tags:              this.tags,
        tables:            this.tables,
        visualizations:    this.visualizations,
        host:              this.options.config.account_host,
        vertical_offset:   8,
        horizontal_offset: 5,
        template_base:     'common/views/tag_dropdown'
      });

      this.filterTag.bind("tag", function(opt) {
        var model;

        if (opt.model == 'derived') model = "visualizations";
        else model = "tables";

        self._goto(null, "/" + model + "/tag/" + opt.tag);
      });

      this.$el.append(this.filterTag.render().el);

      cdb.god.bind("closeDialogs", this.filterTag.hide, this.filterTag);

    },

    _setupSearchView: function() {

      var self = this;

      // Search form
      this.searchView = new cdb.ui.common.SearchView({
        el: this.$('.search_bar')
      });

      this.searchView.bind('search', function(q) {
        var model = dashboard.startView.model.get("what");

        if (q) {
          self._goto(null, model + "/search/" + q);
        } else {
          self._goto(null, model);
        }

      });

    },

    _setupStartView: function() {
      this.startView = new cdb.admin.dashboard.StartView({
        el:                 this.$el,
        tablesView:         this.tablesView,
        visualizationsView: this.visualizationsView,
        user:               this.user,
        importer:           this.importer,
        config:             this.options.config
      });
    },

    _initViews: function() {

      var self = this;

      // Background Importer
      this.importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.importer.render().el);

      // User menu dropdown
      var user_menu = this.user_menu = new cdb.admin.DropdownMenu({
        target:         this.$('a.account'),
        host:           config.account_host,
        username:       username,
        template_base:  'common/views/settings_item'
      });

      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(this.user_menu.render().el);

      // User data
      this.user_stats = new cdb.admin.dashboard.UserStats({
        el:    this.$('div.subheader'),
        model: this.user
      });

      this.user_stats.render();

      this._setupSearchView();
      this._setupVisualizations();
      this._setupTables();
      this._setupTags();
      this._setupStartView();

      this._checkActiveImports();

      // global click
      enableClickOut(this.$el);
    },

    /**
    *  Check if there is any pending import in the background
    */
    _checkActiveImports: function() {
      // Check pending importations
      var imports = new cdb.admin.Imports()
      , self    = this;

      // Start background importer
      this.importer.changeState({ state: "checking" });

      imports.bind("importsFinished", function(e){
        self.importer.changeState({ state: "complete" });
        setTimeout(self.bkg_importer.hide, 3000);
        imports.unbind();
      },this).bind("importsFailed", function(imp){
        self.importer.changeState(imp[0].toJSON());
      },this).bind("importsStart", function(e){
        self.importer.changeState({ state: "preprocessing" });
      },this).bind("importsEmpty", function(e){
        self.importer.hide();
        imports.unbind();
      });

      imports.pollCheck();
    },

    /**
    *  Calculate scroll pagination and moves the asides
    *  when it is necessary
    */
    _whenScroll: function(ev) {

      this.tableAside.scroll(ev);
      this.visAside.scroll(ev);

    },

  });

  var DashboardRouter = Backbone.Router.extend({

    routes: {
      // Dashboard
      '':                      'index',
      '/':                     'index',
      'dashboard':             'index',
      'dashboard/':            'index',

      // Search
      ':model/search/:q':       'search',
      ':model/search/:q/:page': 'search',

      // Tags
      ':model/tag/:tag':       'tag',
      ':model/tag/:tag/:page': 'tag',
      'tag/:tag/:page':        'tag',

      // Tables
      'tables':                'tables',
      'tables/:page':          'tables',

      // Visualizations
      'visualizations':        'visualizations',
      'visualizations/:page':  'visualizations'

    },

    _select: function(name) {

      $("header a").removeClass("selected");
      $("header ." + name).addClass("selected");

    },

    search: function(model, q, page) {

      dashboard.startView.model.set("path", "search");
      dashboard.startView.model.set("what", model);

      dashboard.searchView.setQuery(q);

      if (model == 'visualizations') {

        dashboard.tablesView.hide();

        dashboard.visualizationsView.showDefaultTitle(true);
        dashboard.visualizations.options.set({ q: q, page: page || 1, tags: "", per_page: dashboard.visualizations._ITEMS_PER_PAGE, type: "derived" });
        dashboard.visualizationsView.showLoader();

        var order = dashboard.visSortable.getSortHash();
        dashboard.visualizations.fetch(order);

      } else if (model == 'tables') {

        dashboard.visualizationsView.hide();

        dashboard.tablesView.showDefaultTitle(true);
        dashboard.tables.options.set({ q: q, page: page || 1, tags: "", per_page: dashboard.tables._ITEMS_PER_PAGE, type: "table" });
        dashboard.tablesView.showLoader();
        dashboard.tablesView.model.set("padding", true);

        var order = dashboard.tablesSortable.getSortHash();
        dashboard.tables.fetch(order);

        //dashboard.filterTag.model.set({ type: "table", name: tag });

      }

    },

    tag: function(model, tag, page) {

      dashboard.searchView.setQuery();

      this._select(model);
      dashboard.startView.model.set({ path: model, what: model });

      dashboard.searchView.model.set("visible", true);

      if (model == 'visualizations') {

        dashboard.tablesView.hide();

        dashboard.visualizationsView.showDefaultTitle(true);
        dashboard.visualizations.options.set({ q: "", page: page || 1, tags: tag, per_page: dashboard.visualizations._ITEMS_PER_PAGE, type: "derived" });
        dashboard.visualizationsView.showLoader();

        var order = dashboard.visSortable.getSortHash();
        dashboard.visualizations.fetch(order);

        dashboard.filterTag.model.set({ type: "derived", name: tag });

      } else if (model == 'tables') {

        dashboard.visualizationsView.hide();

        dashboard.tablesView.showDefaultTitle(true);
        dashboard.tables.options.set({ q: "", page: page || 1, tags: tag, per_page: dashboard.tables._ITEMS_PER_PAGE, type: "table" });
        dashboard.tablesView.showLoader();
        dashboard.tablesView.model.set("padding", true);

        var order = dashboard.tablesSortable.getSortHash();
        dashboard.tables.fetch(order);

        dashboard.filterTag.model.set({ type: "table", name: tag });

      }

    },

    index: function() {

      cdb.config.set(config);

      dashboard.startView.model.set("path", "index");
      dashboard.searchView.setQuery();

      this._select("dashboard");

      dashboard.searchView.model.set("visible", false);

      //if (dashboard.tables.options.get("tag_name") === "" && dashboard.tables.options.get("q") === "") {

      // Visualizations
      dashboard.visualizationsView.showDefaultTitle(true);
      dashboard.visualizations.options.set({ q: "", tags: "", per_page: dashboard.visualizations._PREVIEW_ITEMS_PER_PAGE });
      dashboard.visualizationsView.showLoader();

      var order = dashboard.visSortable.getSortHash();
      dashboard.visualizations.fetch(order);

      // Tables
      dashboard.tablesView.showDefaultTitle(true);
      dashboard.tablesView.showLoader();
      dashboard.tablesView.model.set("padding", false);
      dashboard.tables.options.set({ q: "", tags: "", per_page: dashboard.tables._PREVIEW_ITEMS_PER_PAGE, type: "table" });

      var order = dashboard.tablesSortable.getSortHash();
      dashboard.tables.fetch(order);

      // Tags
      dashboard.filterTag.model.set({ type: "" });

    },

    tables: function(page) {
      dashboard.searchView.setQuery();

      this._select("tables");
      dashboard.startView.model.set({path: "tables", what: "tables" });

      dashboard.searchView.model.set("visible", true);

      // Tables
      dashboard.tables.options.set({ q: "", page: page || 1, tags: "", per_page: dashboard.tables._ITEMS_PER_PAGE, type: "table" });
      dashboard.tablesView.showLoader();
      dashboard.tablesView.model.set("padding", true);

      var order = dashboard.tablesSortable.getSortHash();
      dashboard.tables.fetch(order);

      dashboard.tablesView.showDefaultTitle(false);

      // Visualizations
      dashboard.visualizationsView.hide();

      dashboard.filterTag.model.set({ type: "table", name: "" });

    },

    visualizations: function(page) {
      dashboard.searchView.setQuery();

      dashboard.startView.model.set({ path: "visualizations", what: "visualizations" });

      this._select("visualizations");

      dashboard.searchView.model.set("visible", true);

      // Tables
      dashboard.tablesView.hide();

      // Visualizations
      dashboard.visualizationsView.showLoader();
      dashboard.visualizations.options.set({ q: "", page: page || 1, tags: "", per_page: dashboard.visualizations._ITEMS_PER_PAGE, type: "derived" });
      dashboard.visualizationsView.showLoader();

      var order = dashboard.visSortable.getSortHash();
      dashboard.visualizations.fetch(order);

      dashboard.visualizationsView.showDefaultTitle(false);

      dashboard.filterTag.model.set({ type: "derived", name: "" });

    }

  });


   cdb.admin.dashboard.Aside = cdb.core.View.extend({

     initialize: function() {

       this.model      = new cdb.core.Model();
       this.model.bind('change:visible', this._toggleVisibility, this);

     },

     _toggleVisibility: function() {
       if (this.model.get("visible")) this._show();
       else this._hide();
     },

     _show: function() {
       this.$el.css("display", "inline-block");
       this.$el.animate({opacity: 1}, { duration: 250 });
     },

     _hide: function() {
       this.$el.animate({opacity: 0}, { duration: 250, complete: function() {
         $(this).hide();
       }});
     },

     scroll: function(ev) {

       var $aside    = this.$el
       , $list       = this.$el.prev("section")
       , scrolled    = $(ev.target).scrollTop()
       , aside_h     = $aside.outerHeight()

       if ($list.length <= 0) return; // Don't keep going if we don't have the list

       var list_pos  = $list.offset().top
       , list_height = $list.outerHeight();

       if ( scrolled > list_pos ) {
         if ((scrolled + aside_h) < (list_pos + list_height)) {
           $aside
           .addClass("moving")
           .css({
             marginTop: - list_pos
           })
           .removeClass("bottom");
         } else {
           $aside
           .addClass("bottom")
           .removeClass("moving")
           .css({
             marginTop: list_height - aside_h
           })
         }
       } else {
         $aside
         .removeClass("moving bottom")
         .css({
           marginTop: 0
         })
       }
     },

     render: function() {
       return this;
     }

   });



  // var DashboardRouter = Backbone.Router.extend({

  //   routes: {
  //     '':                 'index',
  //     'page/:p':          'paginate',
  //     'tag/:tag/:p':      'searchTag',
  //     'search/:query/:p': 'searchQuery'
  //   },

  //   initialize: function() {
  //     window.dashboard.tables.options.bind("change", this.update ,this);
  //   },

  //   update: function() {
  //     var hash = window.location.hash.split("/");
  //     hash[hash.length - 1] = window.dashboard.tables.options.get("page");
  //     this.navigate(hash.join("/"));
  //   },

  //   index: function() {
  //     window.dashboard.tables.options.set({
  //       "tag_name"  : "",
  //       "q"         : "",
  //       "page"      : 1
  //     });

  //     window.dashboard.filterTag.clear();

  //   },

  //   searchTag: function(tag,p) {
  //     window.dashboard.tables.options.set({
  //       "tag_name"  : tag,
  //       "page"      : p,
  //       "q"         : ""
  //     });
  //   },

  //   searchQuery: function(query,p) {
  //     window.dashboard.tables.options.set({
  //       "tag_name"  : "",
  //       "page"      : p,
  //       "q"         : query
  //     });

  //     window.dashboard.filterTag.clear();

  //   },
  //   paginate: function(p) {
  //     window.dashboard.tables.options.set({
  //       "tag_name"  : "",
  //       "page"      : p,
  //       "q"         : ""
  //     });

  //     window.dashboard.filterTag.clear();

  //   }
  // });

  /*
  * View to control the aside next to a vis/table list
  */

  // cdb.admin.dashboard.Aside = cdb.core.View.extend({

  //   initialize: function() {

  //     this.model      = new cdb.core.Model();
  //     this.model.bind('change:visible', this._toggleVisibility, this);

  //   },

  //   _toggleVisibility: function() {
  //     if (this.model.get("visible")) this._show();
  //     else this._hide();
  //   },

  //   _show: function() {
  //     this.$el.css("display", "inline-block");
  //     this.$el.animate({opacity: 1}, { duration: 250 });
  //   },

  //   _hide: function() {
  //     this.$el.animate({opacity: 0}, { duration: 250, complete: function() {
  //       $(this).hide();
  //     }});
  //   },

  //   scroll: function(ev) {

  //     var $aside    = this.$el
  //     , $list       = this.$el.prev("section")
  //     , scrolled    = $(ev.target).scrollTop()
  //     , aside_h     = $aside.outerHeight()

  //     if ($list.length <= 0) return; // Don't keep going if we don't have the list

  //     var list_pos  = $list.offset().top
  //     , list_height = $list.outerHeight();

  //     if ( scrolled > list_pos ) {
  //       if ((scrolled + aside_h) < (list_pos + list_height)) {
  //         $aside
  //         .addClass("moving")
  //         .css({
  //           marginTop: - list_pos
  //         })
  //         .removeClass("bottom");
  //       } else {
  //         $aside
  //         .addClass("bottom")
  //         .removeClass("moving")
  //         .css({
  //           marginTop: list_height - aside_h
  //         })
  //       }
  //     } else {
  //       $aside
  //       .removeClass("moving bottom")
  //       .css({
  //         marginTop: 0
  //       })
  //     }
  //   },

  //   render: function() {
  //     return this;
  //   }

  // });

  // cdb.admin.dashboard.OrderSelector = cdb.core.View.extend({

  //   events: {
  //     'click a': '_changeOrder'
  //   },

  //   initialize: function() {

  //     this.tableList  = this.options.tableList;
  //     this.model      = new cdb.core.Model();

  //     this.add_related_model(this.tableList);

  //     this.model.bind('change:visible', this._toggleVisibility, this);

  //   },

  //   _changeOrder: function(e) {

  //     e.preventDefault();
  //     e.stopPropagation();

  //     var $link = $(e.target);

  //     var orderBy = $(e).attr("data-order");

  //     $link.parent().find("a").removeClass("selected");
  //     $link.addClass("selected");

  //   },

  //   _toggleVisibility: function() {
  //     if (this.model.get("visible")) this._show();
  //     else this._hide();
  //   },

  //   _show: function() {
  //     this.$el.css("opacity", 1);
  //     this.$el.fadeIn(250);
  //   },

  //   _hide: function() {
  //     this.$el.fadeOut(250, function() {
  //       $(this).css("opacity", 0);
  //     });
  //   },

  //   render: function() {
  //     return this;
  //   }

  // });

  // /**
  // * Toggle button for tables and visualizations that allows to hide/show them
  // */
  // cdb.admin.dashboard.ToggleButton = cdb.core.View.extend({

  //   events: {
  //     'click .toggle': '_toggle'
  //   },

  //   _saveState: function(state) {

  //     if (this.options.kind == 'visualizations') {
  //       this.localStorage.set({ visualizations_toggle: state });
  //     } else {
  //       this.localStorage.set({ tables_toggle: state });
  //     }

  //   },

  //   _toggle: function(e) {
  //     e.preventDefault();
  //     e.stopPropagation();

  //     var toggleID = this.toggleID;

  //     var toggle = !this.localStorage.get(toggleID);

  //     toggle ? this.show() : this.hide();
  //   },

  //   show: function() {

  //     this._saveState(true);

  //     this.$toggle.addClass("active");

  //     _.each(this.options.elements, function(e) {
  //       e.model.set("visible", true);
  //     });

  //   },

  //   hide: function() {

  //     this._saveState(false);

  //     this.$toggle.removeClass("active");

  //     _.each(this.options.elements, function(e) {
  //       e.model.set("visible", false);
  //     });


  //   },

  //   initialize: function() {

  //     // helpers
  //     this.$section     = this.$el;
  //     this.$toggle      = this.$section.find(".toggle");

  //     this.toggleID     = this.options.kind + "_toggle";
  //     this.localStorage = new cdb.admin.localStorage(this.toggleID);

  //     var toggle = this.localStorage.get(this.toggleID);

  //     toggle ? this.show() : this.hide();

  //   },

  //   render: function() {
  //     return this;
  //   }
  // });


  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    var router = new DashboardRouter();

    var dashboard = new Dashboard({
      user_data: user_data,
      config:    config,
      router:    router
    });

    // Expose to debug
    window.dashboard = dashboard;

    Backbone.history.start({ pushState: true, root: "/dashboard/"})
    //Backbone.history.start();

  });

});


// // Tipsy
// this.$el.find("a.tooltip").tipsy({ gravity: 's', fade: true, live: true });

// this.tableAside = new cdb.admin.dashboard.Aside({
//   el: this.$el.find("article.tables aside")
// });

// this.visAside = new cdb.admin.dashboard.Aside({
//   el: this.$el.find("article.visualizations aside")
// });

// this.tableOrderSelector = new cdb.admin.dashboard.OrderSelector({
//   el: this.$el.find("section.tables .order"),
//   tableList: this.tableList
// });

// this.visOrderSelector = new cdb.admin.dashboard.OrderSelector({
//   el: this.$el.find("section.visualizations .order"),
//   tableList: this.VisualizationList
// });

// this.toggleTable = new cdb.admin.dashboard.ToggleButton({
//   el:      this.$el.find("section.tables"),
//   kind:   "tables",
//   config:  this.options.config,
//   elements: [this.tableList, this.tableOrderSelector, this.tableAside, this.tablePaginator]
// });

// this.toggleVisualization = new cdb.admin.dashboard.ToggleButton({
//   el:      this.$el.find("section.visualizations"),
//   kind:   "visualizations",
//   config:  this.options.config,
//   elements: [this.VisualizationList, this.visOrderSelector, this.visAside, this.visPaginator]
// });
// check imports
