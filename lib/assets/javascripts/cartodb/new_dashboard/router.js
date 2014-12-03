var Backbone = require('backbone');
var _ = require('underscore');

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

module.exports = Backbone.Router.extend({

  routes: {

    // TODO: check these routes and make the list smart and short
    
    // Index
    '':                                       'datasets',
    '?:queries':                              'datasets',
    '/':                                      'datasets',
    '/?:queries':                             'datasets',

    // Dashboard
    'dashboard':                              'datasets',
    'dashboard?:queries':                     'datasets',
    'dashboard/':                             'datasets',
    'dashboard/?:queries':                    'datasets',

    // Search locked maps in shared maps
    ':model/shared/locked/search/:q':         'search',
    ':model/shared/locked/search/:q/:page':   'search',

    // Search only in my shared datasets/maps
    ':model/shared/search/:q':                'search',
    ':model/shared/search/:q/:page':          'search',

    // Search locked maps
    ':model/locked/search/:q':                'search',
    ':model/locked/search/:q/:page':          'search',

    // Search
    ':model/search/:q':                       'search',
    ':model/search/:q/:page':                 'search',

    // Tags only in shared locked maps
    ':model/shared/locked/tag/:tag':          'tag',
    ':model/shared/locked/tag/:tag/:page':    'tag',
    'shared/locked/tag/:tag/:page':           'tag',

    // Tags only in shared datasets/maps
    ':model/shared/tag/:tag':                 'tag',
    ':model/shared/tag/:tag/:page':           'tag',
    'shared/tag/:tag/:page':                  'tag',

    // Tags in my locked maps
    ':model/locked/tag/:tag':                 'tag',
    ':model/locked/tag/:tag/:page':           'tag',
    'locked/tag/:tag/:page':                  'tag',

    // Tags
    ':model/tag/:tag':                        'tag',
    ':model/tag/:tag/:page':                  'tag',
    'tag/:tag/:page':                         'tag',

    // Shared locked datasets
    'datasets/shared/locked':                 'datasets',
    'datasets/shared/locked/':                'datasets',
    'datasets/shared/locked?:q':              'datasets',
    'datasets/shared/locked/:page':           'datasets',
    'datasets/shared/locked/:page?:q':        'datasets',

    // Shared datasets     
    'datasets/shared':                        'datasets',
    'datasets/shared/':                       'datasets',
    'datasets/shared?:q':                     'datasets',
    'datasets/shared/:page':                  'datasets',
    'datasets/shared/:page?:q':               'datasets',

    // Datasets locked
    'datasets/locked':                        'datasets',
    'datasets/locked/':                       'datasets',
    'datasets/locked?:q':                     'datasets',
    'datasets/locked/:page':                  'datasets',
    'datasets/locked/:page?:q':               'datasets',

    // Datasets     
    'datasets':                               'datasets',
    'datasets/':                              'datasets',
    'datasets?:q':                            'datasets',
    'datasets/:page':                         'datasets',
    'datasets/:page?:q':                      'datasets',

    // My shared locked maps
    'maps/shared/locked':                     'maps',
    'maps/shared/locked/':                    'maps',
    'maps/shared/locked?:q':                  'maps',
    'maps/shared/locked/:page':               'maps',
    'maps/shared/locked/:page?:q':            'maps',

    // My shared maps
    'maps/shared':                            'maps',
    'maps/shared/':                           'maps',
    'maps/shared?:q':                         'maps',
    'maps/shared/:page':                      'maps',
    'maps/shared/:page?:q':                   'maps',

    // Locked maps
    'maps/locked':                            'maps',
    'maps/locked/':                           'maps',
    'maps/locked?:q':                         'maps',
    'maps/locked/:page':                      'maps',
    'maps/locked/:page?:q':                   'maps',

    // Maps     
    'maps':                                   'maps',
    'maps/':                                  'maps',
    'maps?:q':                                'maps',
    'maps/:page':                             'maps',
    'maps/:page?:q':                          'maps'
  },

  initialize: function() {
    // Start a model with default url params
    this.model = new cdb.core.Model({
      model:          '',
      page:           1,
      q:              '',
      tag:            '',
      exclude_shared: true,
      locked:         false,
      liked:          false
    });
  },

  navigate: function(path, opts) {
    // Remove prefix + dashboard
    var prefix = cdb.config.prefixUrl() + '/dashboard';
    path = path.replace(prefix, '');
    Backbone.Router.prototype.navigate.call(arguments);
  },

  search: function(model, q, page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('shared/search') === -1;
    var locked = Backbone.history.fragment.search('locked/search') !== -1;
    var liked = Backbone.history.fragment.search('liked/search') !== -1;
    
    this.model.set({
      action:         'search',
      model:          model,
      q:              q,
      tag:            '',
      page:           page,
      exclude_shared: exclude_shared,
      locked:         locked,
      liked:          liked
    });
  },

  tag: function(model, tag, page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('shared/tag') === -1;
    var locked = Backbone.history.fragment.search('locked/tag') !== -1;
    var liked = Backbone.history.fragment.search('liked/tag') !== -1;

    this.model.set({
      action:         'tag',
      model:          model,
      tag:            tag,
      q:              '',
      page:           page,
      exclude_shared: exclude_shared,
      locked:         locked,
      liked:          liked
    });
  },

  datasets: function(page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('datasets/shared') === -1;
    var locked = Backbone.history.fragment.search('datasets/locked') !== -1 || Backbone.history.fragment.search('shared/locked') !== -1;
    var liked = Backbone.history.fragment.search('datasets/liked') !== -1;

    this.model.set({
      model:          'datasets',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: exclude_shared,
      locked:         locked,
      liked:          liked
    });
  },

  maps: function(page) {
    page = this._getPage(page);
    var exclude_shared = Backbone.history.fragment.search('maps/datasets') === -1;
    var locked = Backbone.history.fragment.search('maps/locked') !== -1 || Backbone.history.fragment.search('shared/locked') !== -1;
    var liked = Backbone.history.fragment.search('maps/liked') !== -1;

    this.model.set({
      model:          'maps',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: exclude_shared,
      locked:         locked,
      liked:          liked
    });
  },

  _getPage: function(page) {
    page = parseInt(page);
    return page && _.isNumber(page) ? page : 1;
  }

});
