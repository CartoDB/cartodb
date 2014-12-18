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
    'dashboard?:queries':                                      '_changeRouteToDatasets',
    'dashboard/':                                              '_changeRouteToDatasets',
    'dashboard/?:queries':                                     '_changeRouteToDatasets',

    // Search locked maps in shared datasets/maps
    'dashboard/:content_type/shared/locked/search/:q':         '_changeRouteToSearch',
    'dashboard/:content_type/shared/locked/search/:q/:page':   '_changeRouteToSearch',

    // Search liked maps in shared datasets/maps
    'dashboard/:content_type/liked/locked/search/:q':          '_changeRouteToSearch',
    'dashboard/:content_type/liked/locked/search/:q/:page':    '_changeRouteToSearch',

    // Search only in my shared datasets/maps
    'dashboard/:content_type/shared/search/:q':                '_changeRouteToSearch',
    'dashboard/:content_type/shared/search/:q/:page':          '_changeRouteToSearch',

    // Search locked datasets/maps
    'dashboard/:content_type/locked/search/:q':                '_changeRouteToSearch',
    'dashboard/:content_type/locked/search/:q/:page':          '_changeRouteToSearch',

    // Search only in my liked datasets/maps
    'dashboard/:content_type/liked/search/:q':                 '_changeRouteToSearch',
    'dashboard/:content_type/liked/search/:q/:page':           '_changeRouteToSearch',

    // Search only in data library
    'dashboard/:content_type/library/search/:q':               '_changeRouteToSearch',
    'dashboard/:content_type/library/search/:q/:page':         '_changeRouteToSearch',

    // Search
    'dashboard/:content_type/search/:q':                       '_changeRouteToSearch',
    'dashboard/:content_type/search/:q/:page':                 '_changeRouteToSearch',

    // Tags only in shared locked datasets/maps
    'dashboard/:content_type/shared/locked/tag/:tag':          '_changeRouteToTag',
    'dashboard/:content_type/shared/locked/tag/:tag/:page':    '_changeRouteToTag',

    // Tags only in liked locked datasets/maps
    'dashboard/:content_type/liked/locked/tag/:tag':           '_changeRouteToTag',
    'dashboard/:content_type/liked/locked/tag/:tag/:page':     '_changeRouteToTag',

    // Tags only in shared datasets/maps
    'dashboard/:content_type/shared/tag/:tag':                 '_changeRouteToTag',
    'dashboard/:content_type/shared/tag/:tag/:page':           '_changeRouteToTag',

    // Tags only in liked datasets/maps
    'dashboard/:content_type/liked/tag/:tag':                  '_changeRouteToTag',
    'dashboard/:content_type/liked/tag/:tag/:page':            '_changeRouteToTag',

    // Tags in my locked datasets/maps
    'dashboard/:content_type/locked/tag/:tag':                 '_changeRouteToTag',
    'dashboard/:content_type/locked/tag/:tag/:page':           '_changeRouteToTag',

    // Tags in library datasets/maps
    'dashboard/:content_type/library/tag/:tag':                '_changeRouteToTag',
    'dashboard/:content_type/library/tag/:tag/:page':          '_changeRouteToTag',

    // Tags
    'dashboard/:content_type/tag/:tag':                        '_changeRouteToTag',
    'dashboard/:content_type/tag/:tag/:page':                  '_changeRouteToTag',

    // Liked datasets
    'dashboard/datasets/liked':                         '_changeRouteToDatasets',
    'dashboard/datasets/liked/':                        '_changeRouteToDatasets',
    'dashboard/datasets/liked?:q':                      '_changeRouteToDatasets',
    'dashboard/datasets/liked/:page':                   '_changeRouteToDatasets',
    'dashboard/datasets/liked/:page?:q':                '_changeRouteToDatasets',

    // Shared locked datasets
    'dashboard/datasets/shared/locked':                 '_changeRouteToDatasets',
    'dashboard/datasets/shared/locked/':                '_changeRouteToDatasets',
    'dashboard/datasets/shared/locked?:q':              '_changeRouteToDatasets',
    'dashboard/datasets/shared/locked/:page':           '_changeRouteToDatasets',
    'dashboard/datasets/shared/locked/:page?:q':        '_changeRouteToDatasets',

    // Shared datasets     
    'dashboard/datasets/shared':                        '_changeRouteToDatasets',
    'dashboard/datasets/shared/':                       '_changeRouteToDatasets',
    'dashboard/datasets/shared?:q':                     '_changeRouteToDatasets',
    'dashboard/datasets/shared/:page':                  '_changeRouteToDatasets',
    'dashboard/datasets/shared/:page?:q':               '_changeRouteToDatasets',

    // Datasets locked
    'dashboard/datasets/locked':                        '_changeRouteToDatasets',
    'dashboard/datasets/locked/':                       '_changeRouteToDatasets',
    'dashboard/datasets/locked?:q':                     '_changeRouteToDatasets',
    'dashboard/datasets/locked/:page':                  '_changeRouteToDatasets',
    'dashboard/datasets/locked/:page?:q':               '_changeRouteToDatasets',

    // Library datasets
    'dashboard/datasets/library':                       '_changeRouteToDatasets',
    'dashboard/datasets/library/':                      '_changeRouteToDatasets',
    'dashboard/datasets/library?:q':                    '_changeRouteToDatasets',
    'dashboard/datasets/library/:page':                 '_changeRouteToDatasets',
    'dashboard/datasets/library/:page?:q':              '_changeRouteToDatasets',

    // Datasets     
    'dashboard/datasets':                               '_changeRouteToDatasets',
    'dashboard/datasets/':                              '_changeRouteToDatasets',
    'dashboard/datasets?:q':                            '_changeRouteToDatasets',
    'dashboard/datasets/:page':                         '_changeRouteToDatasets',
    'dashboard/datasets/:page?:q':                      '_changeRouteToDatasets',

    // My shared maps
    'dashboard/maps/shared':                            '_changeRouteToMaps',
    'dashboard/maps/shared/':                           '_changeRouteToMaps',
    'dashboard/maps/shared?:q':                         '_changeRouteToMaps',
    'dashboard/maps/shared/:page':                      '_changeRouteToMaps',
    'dashboard/maps/shared/:page?:q':                   '_changeRouteToMaps',

    // Locked maps
    'dashboard/maps/locked':                            '_changeRouteToMaps',
    'dashboard/maps/locked/':                           '_changeRouteToMaps',
    'dashboard/maps/locked?:q':                         '_changeRouteToMaps',
    'dashboard/maps/locked/:page':                      '_changeRouteToMaps',
    'dashboard/maps/locked/:page?:q':                   '_changeRouteToMaps',

    // Shared locked maps
    'dashboard/maps/shared/locked':                     '_changeRouteToMaps',
    'dashboard/maps/shared/locked/':                    '_changeRouteToMaps',
    'dashboard/maps/shared/locked?:q':                  '_changeRouteToMaps',
    'dashboard/maps/shared/locked/:page':               '_changeRouteToMaps',
    'dashboard/maps/shared/locked/:page?:q':            '_changeRouteToMaps',

    // Liked maps
    'dashboard/maps/liked':                             '_changeRouteToMaps',
    'dashboard/maps/liked/':                            '_changeRouteToMaps',
    'dashboard/maps/liked?:q':                          '_changeRouteToMaps',
    'dashboard/maps/liked/:page':                       '_changeRouteToMaps',
    'dashboard/maps/liked/:page?:q':                    '_changeRouteToMaps',

    // Maps     
    'dashboard/maps':                                   '_changeRouteToMaps',
    'dashboard/maps/':                                  '_changeRouteToMaps',
    'dashboard/maps?:q':                                '_changeRouteToMaps',
    'dashboard/maps/:page':                             '_changeRouteToMaps',
    'dashboard/maps/:page?:q':                          '_changeRouteToMaps'
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

  _changeRouteToSearch: function(contentType, q, page) {
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

  _changeRouteToTag: function(contentType, tag, page) {
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

  _changeRouteToDatasets: function(page) {
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

  _changeRouteToMaps: function(page) {
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
