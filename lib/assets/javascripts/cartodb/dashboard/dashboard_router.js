cdb.admin.dashboard.DashboardRouter = Backbone.Router.extend({

  routes: {
    
    // Index
    '':                                       'tables',
    '?:queries':                              'tables',
    '/':                                      'tables',
    '/?:queries':                             'tables',
        
    // Organization dashboard       
    'u/:user/dashboard':                      'tables',
    'u/:user/dashboard?queries':              'tables',
    'u/:user/dashboard/':                     'tables',
    'u/:user/dashboard/?queries':             'tables',

    // Dashboard
    'dashboard':                              'tables',
    'dashboard?:queries':                     'tables',
    'dashboard/':                             'tables',
    'dashboard/?:queries':                    'tables',

    // Shared search
    ':model/shared/search/:q':                'search',
    ':model/shared/search/:q/:page':          'search',

    // Search
    ':model/search/:q':                       'search',
    ':model/search/:q/:page':                 'search',

    // Shared tags
    ':model/shared/tag/:tag':                 'tag',
    ':model/shared/tag/:tag/:page':           'tag',
    'shared/tag/:tag/:page':                  'tag',

    // Tags
    ':model/tag/:tag':                        'tag',
    ':model/tag/:tag/:page':                  'tag',
    'tag/:tag/:page':                         'tag',

    // Organization shared tables
    'u/:user/tables/shared':                  'tables',
    'u/:user/tables/shared/':                 'tables',
    'u/:user/tables/shared?:q':               'tables',
    'u/:user/tables/shared/:page':            'tables',
    'u/:user/tables/shared/:page?:q':         'tables',

    // Shared tables      
    'tables/shared':                          'tables',
    'tables/shared/':                         'tables',
    'tables/shared?:q':                       'tables',
    'tables/shared/:page':                    'tables',
    'tables/shared/:page?:q':                 'tables',

    // Organization tables
    'u/:user/tables':                         'tables',
    'u/:user/tables/':                        'tables',
    'u/:user/tables?:q':                      'tables',
    'u/:user/tables/:page':                   'tables',
    'u/:user/tables/:page?:q':                'tables',

    // Tables     
    'tables':                                 'tables',
    'tables/':                                'tables',
    'tables?:q':                              'tables',
    'tables/:page':                           'tables',
    'tables/:page?:q':                        'tables',

    // Organization shared visualizations
    'u/:user/visualizations/shared':          'visualizations',
    'u/:user/visualizations/shared/':         'visualizations',
    'u/:user/visualizations/shared?:q':       'visualizations',
    'u/:user/visualizations/shared/:page':    'visualizations',
    'u/:user/visualizations/shared/:page?:q': 'visualizations',

    // Shared visualizations
    'visualizations/shared':                  'visualizations',
    'visualizations/shared/':                 'visualizations',
    'visualizations/shared?:q':               'visualizations',
    'visualizations/shared/:page':            'visualizations',
    'visualizations/shared/:page?:q':         'visualizations',

    // Organization visualizations
    'u/:user/visualizations':                 'visualizations',
    'u/:user/visualizations/':                'visualizations',
    'u/:user/visualizations?:q':              'visualizations',
    'u/:user/visualizations/:page':           'visualizations',
    'u/:user/visualizations/:page?:q':        'visualizations',

    // Visualizations     
    'visualizations':                         'visualizations',
    'visualizations/':                        'visualizations',
    'visualizations?:q':                      'visualizations',
    'visualizations/:page':                   'visualizations',
    'visualizations/:page?:q':                'visualizations'
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

  search: function(model, q, page) {
    page = this.getPage(page);
    var shared = Backbone.history.fragment.search('shared/search') !== -1;
    
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
    page = this.getPage(page);
    var shared = Backbone.history.fragment.search('shared/tag') !== -1;

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