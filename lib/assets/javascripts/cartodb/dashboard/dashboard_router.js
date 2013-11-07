cdb.admin.dashboard.DashboardRouter = Backbone.Router.extend({

  routes: {
    // Dashboard
    '':                         'tables',
    '?:queries':                'tables',
    '/':                        'tables',
    '/?:queries':               'tables',
    'dashboard':                'tables',
    'dashboard?:queries':       'tables',
    'dashboard/':               'tables',
    'dashboard/?:queries':      'tables',

    // Search
    ':model/search/:q':         'search',
    ':model/search/:q/:page':   'search',

    // Tags
    ':model/tag/:tag':          'tag',
    ':model/tag/:tag/:page':    'tag',
    'tag/:tag/:page':           'tag',

    // Tables
    'tables':                   'tables',
    'tables?:q':                'tables',
    'tables/:page':             'tables',
    'tables/:page?:q':          'tables',

    // Visualizations
    'visualizations':           'visualizations',
    'visualizations?:q':        'visualizations',
    'visualizations/:page':     'visualizations',
    'visualizations/:page?:q':  'visualizations'

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
    page = this.getPage(page);
    this._select("tables");
    this.trigger("tables", page, this);
  },

  visualizations: function(page) {
    page = this.getPage(page);
    this._select("visualizations");
    this.trigger("visualizations", page , this);
  },

  getPage: function(page) {
    page = parseInt(page);
    return page && _.isNumber(page) ? page : 1;
  }

});


