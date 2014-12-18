var _ = require('underscore');
var Router = require('new_common/router');

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
module.exports = Router.extend({

  routes: {

    // Index
    'dashboard?:queries':                                      'datasets',
    'dashboard/':                                              'datasets',
    'dashboard/?:queries':                                     'datasets',

    // Search locked maps in shared datasets/maps
    'dashboard/:content_type/shared/locked/search/:q':         'search',
    'dashboard/:content_type/shared/locked/search/:q/:page':   'search',

    // Search liked maps in shared datasets/maps
    'dashboard/:content_type/liked/locked/search/:q':          'search',
    'dashboard/:content_type/liked/locked/search/:q/:page':    'search',

    // Search only in my shared datasets/maps
    'dashboard/:content_type/shared/search/:q':                'search',
    'dashboard/:content_type/shared/search/:q/:page':          'search',

    // Search locked datasets/maps
    'dashboard/:content_type/locked/search/:q':                'search',
    'dashboard/:content_type/locked/search/:q/:page':          'search',

    // Search only in my liked datasets/maps
    'dashboard/:content_type/liked/search/:q':                 'search',
    'dashboard/:content_type/liked/search/:q/:page':           'search',

    // Search only in data library
    'dashboard/:content_type/library/search/:q':               'search',
    'dashboard/:content_type/library/search/:q/:page':         'search',

    // Search
    'dashboard/:content_type/search/:q':                       'search',
    'dashboard/:content_type/search/:q/:page':                 'search',

    // Tags only in shared locked datasets/maps
    'dashboard/:content_type/shared/locked/tag/:tag':          'tag',
    'dashboard/:content_type/shared/locked/tag/:tag/:page':    'tag',

    // Tags only in liked locked datasets/maps
    'dashboard/:content_type/liked/locked/tag/:tag':           'tag',
    'dashboard/:content_type/liked/locked/tag/:tag/:page':     'tag',

    // Tags only in shared datasets/maps
    'dashboard/:content_type/shared/tag/:tag':                 'tag',
    'dashboard/:content_type/shared/tag/:tag/:page':           'tag',

    // Tags only in liked datasets/maps
    'dashboard/:content_type/liked/tag/:tag':                  'tag',
    'dashboard/:content_type/liked/tag/:tag/:page':            'tag',

    // Tags in my locked datasets/maps
    'dashboard/:content_type/locked/tag/:tag':                 'tag',
    'dashboard/:content_type/locked/tag/:tag/:page':           'tag',

    // Tags in library datasets/maps
    'dashboard/:content_type/library/tag/:tag':                'tag',
    'dashboard/:content_type/library/tag/:tag/:page':          'tag',

    // Tags
    'dashboard/:content_type/tag/:tag':                        'tag',
    'dashboard/:content_type/tag/:tag/:page':                  'tag',

    // Liked datasets
    'dashboard/datasets/liked':                         'datasets',
    'dashboard/datasets/liked/':                        'datasets',
    'dashboard/datasets/liked?:q':                      'datasets',
    'dashboard/datasets/liked/:page':                   'datasets',
    'dashboard/datasets/liked/:page?:q':                'datasets',

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

    // Library datasets
    'dashboard/datasets/library':                       'datasets',
    'dashboard/datasets/library/':                      'datasets',
    'dashboard/datasets/library?:q':                    'datasets',
    'dashboard/datasets/library/:page':                 'datasets',
    'dashboard/datasets/library/:page?:q':              'datasets',

    // Datasets     
    'dashboard/datasets':                               'datasets',
    'dashboard/datasets/':                              'datasets',
    'dashboard/datasets?:q':                            'datasets',
    'dashboard/datasets/:page':                         'datasets',
    'dashboard/datasets/:page?:q':                      'datasets',

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

    // Shared locked maps
    'dashboard/maps/shared/locked':                     'maps',
    'dashboard/maps/shared/locked/':                    'maps',
    'dashboard/maps/shared/locked?:q':                  'maps',
    'dashboard/maps/shared/locked/:page':               'maps',
    'dashboard/maps/shared/locked/:page?:q':            'maps',

    // Liked maps
    'dashboard/maps/liked':                             'maps',
    'dashboard/maps/liked/':                            'maps',
    'dashboard/maps/liked?:q':                          'maps',
    'dashboard/maps/liked/:page':                       'maps',
    'dashboard/maps/liked/:page?:q':                    'maps',

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
      content_type:          '',
      page:           1,
      q:              '',
      tag:            '',
      exclude_shared: true,
      locked:         false,
      liked:          false,
      library:        false
    });
  },

  search: function(contentType, q, page) {
    page = this._getPage(page);
    var excludeShared = !this._hasCurrentUrl('shared/search');
    var locked = this._hasCurrentUrl('locked/search');
    var liked = this._hasCurrentUrl('liked/search');
    var library = this._hasCurrentUrl('library/search');

    this.model.set({
      action:         'search',
      content_type:   contentType,
      q:              q,
      tag:            '',
      page:           page,
      exclude_shared: excludeShared,
      locked:         locked,
      liked:          liked,
      library:        library
    });
  },

  tag: function(contentType, tag, page) {
    page = this._getPage(page);
    var excludeShared = !this._hasCurrentUrl('shared/tag');
    var locked = this._hasCurrentUrl('locked/tag');
    var liked = this._hasCurrentUrl('liked/tag');
    var library = this._hasCurrentUrl('library/tag');

    this.model.set({
      action:         'tag',
      content_type:   contentType,
      tag:            decodeURIComponent(tag),
      q:              '',
      page:           page,
      exclude_shared: excludeShared,
      locked:         locked,
      liked:          liked,
      library:        library
    });
  },

  datasets: function(page) {
    page = this._getPage(page);
    var excludeShared = !this._hasCurrentUrl('datasets/shared');
    var locked = this._hasCurrentUrl('datasets/locked') || this._hasCurrentUrl('shared/locked');
    var liked = this._hasCurrentUrl('datasets/liked');
    var library = this._hasCurrentUrl('datasets/library');

    this.model.set({
      content_type:   'datasets',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: excludeShared,
      locked:         locked,
      liked:          liked,
      library:        library
    });
  },

  maps: function(page) {
    page = this._getPage(page);
    var excludeShared = !this._hasCurrentUrl('maps/shared');
    var locked = this._hasCurrentUrl('maps/locked') || this._hasCurrentUrl('shared/locked');
    var liked = this._hasCurrentUrl('maps/liked');

    this.model.set({
      content_type:   'maps',
      page:           page,
      q:              '',
      tag:            '',
      exclude_shared: excludeShared,
      locked:         locked,
      liked:          liked,
      library:        false
    });
  },

  _hasCurrentUrl: function(uri) {
    return Backbone.history.fragment.search(uri) !== -1;
  },

  _getPage: function(page) {
    page = parseInt(page);
    return page && _.isNumber(page) ? page : 1;
  }

});
