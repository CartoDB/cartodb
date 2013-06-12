cdb.admin.dashboard.DashboardRouter = Backbone.Router.extend({

  routes: {
    // Dashboard
    '':                      'index',
    '/':                     'index',
    'dashboard':             'tables',
    'dashboard/':            'tables',

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
    this.trigger("search", { model: model, q: q, page: page }, this);
  },

  tag: function(model, tag, page) {
    this._select(model);
    this.trigger("tag", { model: model, tag: tag, page: page }, this);
  },

  index: function() {
    this._select("dashboard");
    this.trigger("index", this);
  },

  tables: function(page) {
    this._select("tables");
    this.trigger("tables", page, this);
  },

  visualizations: function(page) {
    this._select("visualizations");
    this.trigger("visualizations", page , this);
  }

});


