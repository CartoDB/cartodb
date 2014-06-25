cdb.admin.dashboard.DashboardRouter = Backbone.Router.extend({

  routes: {
    // Dashboard
    '':                               'tables',
    '?:queries':                      'tables',
    '/':                              'tables',
    '/?:queries':                     'tables',
    'dashboard':                      'tables',
    'dashboard?:queries':             'tables',
    'dashboard/':                     'tables',
    'dashboard/?:queries':            'tables',

    // Shared search     
    ':model/shared/search/:q':        'search',
    ':model/shared/search/:q/:page':  'search',

    // Search     
    ':model/search/:q':               'search',
    ':model/search/:q/:page':         'search',

    // Shared tags
    ':model/shared/tag/:tag':         'tag',
    ':model/shared/tag/:tag/:page':   'tag',
    'shared/tag/:tag/:page':          'tag',

    // Tags
    ':model/tag/:tag':                'tag',
    ':model/tag/:tag/:page':          'tag',
    'tag/:tag/:page':                 'tag',

    // Shared tables      
    'tables/shared':                  'tables',
    'tables/shared/':                 'tables',
    'tables/shared?:q':               'tables',
    'tables/shared/:page':            'tables',
    'tables/shared/:page?:q':         'tables',

    // Tables     
    'tables':                         'tables',
    'tables/':                        'tables',
    'tables?:q':                      'tables',
    'tables/:page':                   'tables',
    'tables/:page?:q':                'tables',

    // Shared visualizations
    'visualizations/shared':          'visualizations',
    'visualizations/shared/':         'visualizations',
    'visualizations/shared?:q':       'visualizations',
    'visualizations/shared/:page':    'visualizations',
    'visualizations/shared/:page?:q': 'visualizations',

    // Visualizations     
    'visualizations':                 'visualizations',
    'visualizations/':                'visualizations',
    'visualizations?:q':              'visualizations',
    'visualizations/:page':           'visualizations',
    'visualizations/:page?:q':        'visualizations'
  },

  initialize: function() {

    // Start a model with default url params
    this.model = new cdb.core.Model({
      model:        '',
      page:         1,
      q:            '',
      tag:          '',
      only_shared:  false
    });
  },

  index: function() {
    this.trigger("index", this);
  },

  search: function(model, q, page) {
    var shared = Backbone.history.fragment.search('shared/search') !== -1;
    
    // TODO: deprecate it
    this.trigger("search", { model: model, q: q, page: page, only_shared: shared }, this);

    this.model.set({
      action:       'search',
      model:        model,
      q:            q,
      tag:          '',
      page:         page,
      only_shared:  shared
    });
  },

  tag: function(model, tag, page) {
    var shared = Backbone.history.fragment.search('shared/tag') !== -1;

    // TODO: deprecate it
    this.trigger("tag", {
      model:        model,
      tag:          tag,
      page:         page,
      only_shared:  shared
    }, this);

    this.model.set({
      action:       'tag',
      model:        model,
      tag:          tag,
      q:            '',
      page:         page,
      only_shared:  shared
    });
  },

  tables: function(page) {
    page = this.getPage(page);
    var shared = Backbone.history.fragment.search('tables/shared') !== -1;
    
    // TODO: deprecate it
    this.trigger("tables", { page: page, only_shared: shared }, this);

    this.model.set({
      model:        'tables',
      page:         page,
      q:            '',
      tag:          '',
      only_shared:  shared
    });
  },

  visualizations: function(page) {
    page = this.getPage(page);
    var shared = Backbone.history.fragment.search('visualizations/shared') !== -1;
    
    // TODO: deprecate it
    this.trigger("visualizations", { page: page, only_shared: shared } , this);

    this.model.set({
      model:        'visualizations',
      page:         page,
      q:            '',
      tag:          '',
      only_shared:  shared
    });
  },

  getPage: function(page) {
    page = parseInt(page);
    return page && _.isNumber(page) ? page : 1;
  }

});