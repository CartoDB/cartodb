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

    // Index
    'dashboard':                                       'datasets',
    'dashboard?:queries':                              'datasets',
    'dashboard/':                                      'datasets',
    'dashboard/?:queries':                             'datasets',

    // Search locked maps in shared maps
    'dashboard/:model/shared/locked/search/:q':         'search',
    'dashboard/:model/shared/locked/search/:q/:page':   'search',

    // Search only in my shared datasets/maps
    'dashboard/:model/shared/search/:q':                'search',
    'dashboard/:model/shared/search/:q/:page':          'search',

    // Search locked maps
    'dashboard/:model/locked/search/:q':                'search',
    'dashboard/:model/locked/search/:q/:page':          'search',

    // Search
    'dashboard/:model/search/:q':                       'search',
    'dashboard/:model/search/:q/:page':                 'search',

    // Tags only in shared locked maps
    'dashboard/:model/shared/locked/tag/:tag':          'tag',
    'dashboard/:model/shared/locked/tag/:tag/:page':    'tag',

    // Tags only in shared datasets/maps
    'dashboard/:model/shared/tag/:tag':                 'tag',
    'dashboard/:model/shared/tag/:tag/:page':           'tag',

    // Tags in my locked maps
    'dashboard/:model/locked/tag/:tag':                 'tag',
    'dashboard/:model/locked/tag/:tag/:page':           'tag',

    // Tags
    'dashboard/:model/tag/:tag':                        'tag',
    'dashboard/:model/tag/:tag/:page':                  'tag',

    // Shared locked datasets
    'dashboard/datasets/shared/locked':                 'datasets',
    'dashboard/datasets/shared/locked/':                'datasets',
    'dashboard/datasets/shared/locked?:q':              'datasets',
    'dashboard/datasets/shared/locked/:page':           'datasets',
    'dashboard/datasets/shared/locked/:page?:q':        'datasets',

    // Shared datasets     
    'dashboard/datasets/shared':                        'datasets',
    'dashboard/datasets/shared/':                       'datasets',
    'dashboard/datasets/shared?:q':                     'datasets',
    'dashboard/datasets/shared/:page':                  'datasets',
    'dashboard/datasets/shared/:page?:q':               'datasets',

    // Datasets locked
    'dashboard/datasets/locked':                        'datasets',
    'dashboard/datasets/locked/':                       'datasets',
    'dashboard/datasets/locked?:q':                     'datasets',
    'dashboard/datasets/locked/:page':                  'datasets',
    'dashboard/datasets/locked/:page?:q':               'datasets',

    // Datasets     
    'dashboard/datasets':                               'datasets',
    'dashboard/datasets/':                              'datasets',
    'dashboard/datasets?:q':                            'datasets',
    'dashboard/datasets/:page':                         'datasets',
    'dashboard/datasets/:page?:q':                      'datasets',

    // My shared locked maps
    'dashboard/maps/shared/locked':                     'maps',
    'dashboard/maps/shared/locked/':                    'maps',
    'dashboard/maps/shared/locked?:q':                  'maps',
    'dashboard/maps/shared/locked/:page':               'maps',
    'dashboard/maps/shared/locked/:page?:q':            'maps',

    // My shared maps
    'dashboard/maps/shared':                            'maps',
    'dashboard/maps/shared/':                           'maps',
    'dashboard/maps/shared?:q':                         'maps',
    'dashboard/maps/shared/:page':                      'maps',
    'dashboard/maps/shared/:page?:q':                   'maps',

    // Locked maps
    'dashboard/maps/locked':                            'maps',
    'dashboard/maps/locked/':                           'maps',
    'dashboard/maps/locked?:q':                         'maps',
    'dashboard/maps/locked/:page':                      'maps',
    'dashboard/maps/locked/:page?:q':                   'maps',

    // Maps     
    'dashboard/maps':                                   'maps',
    'dashboard/maps/':                                  'maps',
    'dashboard/maps?:q':                                'maps',
    'dashboard/maps/:page':                             'maps',
    'dashboard/maps/:page?:q':                          'maps'
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
