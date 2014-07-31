
  /**
   *  Backbone router for dashboard urls
   *
   *  - Manage all available urls
   *    · Organization
   *    · Shared
   *    · Pretty urls
   *    · ...
   *
   */


cdb.admin.dashboard.DashboardRouter = Backbone.Router.extend({

  routes: {

    // TODO: check these routes and make the list smart and short
    
    // Index
    '':                                     'tables',
    '?:queries':                            'tables',
    '/':                                    'tables',
    '/?:queries':                           'tables',

    // Dashboard
    'dashboard':                            'tables',
    'dashboard?:queries':                   'tables',
    'dashboard/':                           'tables',
    'dashboard/?:queries':                  'tables',

    // Search locked visualizations in my visualizations
    ':model/mine/locked/search/:q':         'search',
    ':model/mine/locked/search/:q/:page':   'search',

    // Search only in my tables/visualizations
    ':model/mine/search/:q':                'search',
    ':model/mine/search/:q/:page':          'search',

    // Search locked visualizations
    ':model/locked/search/:q':              'search',
    ':model/locked/search/:q/:page':        'search',

    // Search
    ':model/search/:q':                     'search',
    ':model/search/:q/:page':               'search',

    // Tags only in my locked visualizations
    ':model/mine/locked/tag/:tag':          'tag',
    ':model/mine/locked/tag/:tag/:page':    'tag',
    'mine/locked/tag/:tag/:page':           'tag',

    // Tags only in my tables/visualizations
    ':model/mine/tag/:tag':                 'tag',
    ':model/mine/tag/:tag/:page':           'tag',
    'mine/tag/:tag/:page':                  'tag',

    // Tags in my locked visualizations
    ':model/locked/tag/:tag':               'tag',
    ':model/locked/tag/:tag/:page':         'tag',
    'locked/tag/:tag/:page':                'tag',

    // Tags
    ':model/tag/:tag':                      'tag',
    ':model/tag/:tag/:page':                'tag',
    'tag/:tag/:page':                       'tag',

    // My locked tables
    'tables/mine/locked':                   'tables',
    'tables/mine/locked/':                  'tables',
    'tables/mine/locked?:q':                'tables',
    'tables/mine/locked/:page':             'tables',
    'tables/mine/locked/:page?:q':          'tables',

    // My tables     
    'tables/mine':                          'tables',
    'tables/mine/':                         'tables',
    'tables/mine?:q':                       'tables',
    'tables/mine/:page':                    'tables',
    'tables/mine/:page?:q':                 'tables',

    // Tables locked
    'tables/locked':                        'tables',
    'tables/locked/':                       'tables',
    'tables/locked?:q':                     'tables',
    'tables/locked/:page':                  'tables',
    'tables/locked/:page?:q':               'tables',

    // Tables     
    'tables':                               'tables',
    'tables/':                              'tables',
    'tables?:q':                            'tables',
    'tables/:page':                         'tables',
    'tables/:page?:q':                      'tables',

    // My locked visualizations
    'visualizations/mine/locked':           'visualizations',
    'visualizations/mine/locked/':          'visualizations',
    'visualizations/mine/locked?:q':        'visualizations',
    'visualizations/mine/locked/:page':     'visualizations',
    'visualizations/mine/locked/:page?:q':  'visualizations',

    // My visualizations
    'visualizations/mine':                  'visualizations',
    'visualizations/mine/':                 'visualizations',
    'visualizations/mine?:q':               'visualizations',
    'visualizations/mine/:page':            'visualizations',
    'visualizations/mine/:page?:q':         'visualizations',

    // Locked visualizations
    'visualizations/locked':                'visualizations',
    'visualizations/locked/':               'visualizations',
    'visualizations/locked?:q':             'visualizations',
    'visualizations/locked/:page':          'visualizations',
    'visualizations/locked/:page?:q':       'visualizations',

    // Visualizations     
    'visualizations':                       'visualizations',
    'visualizations/':                      'visualizations',
    'visualizations?:q':                    'visualizations',
    'visualizations/:page':                 'visualizations',
    'visualizations/:page?:q':              'visualizations'
  },

  initialize: function() {

    // Start a model with default url params
    this.model = new cdb.core.Model({
      model:          '',
      page:           1,
      q:              '',
      tag:            '',
      exclude_shared: false,
      locked:         false
    });
  },

  search: function(model, q, page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('mine/search') !== -1;
    var locked = Backbone.history.fragment.search('locked/search') !== -1;
    
    this.model.set({
      action:         'search',
      model:          model,
      q:              q,
      tag:            '',
      page:           page,
      exclude_shared: exclude_shared,
      locked:         locked
    });
  },

  tag: function(model, tag, page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('mine/tag') !== -1;
    var locked = Backbone.history.fragment.search('locked/tag') !== -1;

    this.model.set({
      action:         'tag',
      model:          model,
      tag:            tag,
      q:              '',
      page:           page,
      exclude_shared: exclude_shared,
      locked:         locked
    });
  },

  tables: function(page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('tables/mine') !== -1;
    var locked = Backbone.history.fragment.search('tables/locked') !== -1 || Backbone.history.fragment.search('mine/locked') !== -1;

    this.model.set({
      model:          'tables',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: exclude_shared,
      locked:         locked
    });
  },

  visualizations: function(page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('visualizations/mine') !== -1;
    var locked = Backbone.history.fragment.search('visualizations/locked') !== -1 || Backbone.history.fragment.search('mine/locked') !== -1;

    this.model.set({
      model:          'visualizations',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: exclude_shared,
      locked:         locked
    });
  },

  _getPage: function(page) {
    page = parseInt(page);
    return page && _.isNumber(page) ? page : 1;
  }

});