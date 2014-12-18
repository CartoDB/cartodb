var cdb = require('cartodb.js');

/**
 * Implement the URL creation for routes within the dashboard routes scope.
 */
module.exports = cdb.core.Model.extend({
  initialize: function(args) {
    this.routerModel = args.routerModel;
    this.rootUrl =     args.rootUrl;
  },

  byRoot: function(fragment) {
    return this.rootUrl + (fragment || '');
  },

  byContentType: function(fragment) {
    return this.byRoot('/dashboard/'+ this.routerModel.get('content_type') + (fragment || ''));
  },

  byCurrentState: function(fragment) {
    var m = this.routerModel;
    var str = '';

    // Shared and liked don't have any routes so check for either one instead
    if (m.get('shared')) {
      str = '/shared';
    } else if (m.get('liked')) {
      str = '/liked';
    }

    if (m.get('locked')) {
      str += '/locked';
    }

    return this.byContentType(str + (fragment || ''));
  },

  byCurrentStateToTag: function(tag) {
    return this.byCurrentState('/tag/' + encodeURIComponent(tag));
  }
});
