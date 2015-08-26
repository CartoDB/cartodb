var cdb = require('cartodb.js');
var Router = require('../common/router');

/**
 *  Backbone router for organization groups urls.
 */
module.exports = Router.extend({

  routes: {

    // Groups index
    '': '_routeToGroupsIndex',
    // If URL is lacking the trailing slash (e.g. 'http://username.cartodb.com/organization/groups'), treat it like index
    'groups': '_routeToGroupsIndex',
    '*prefix/groups': '_routeToGroupsIndex',

    // Create a new group
    'new': '_routeToCreateGroup',
    'new/': '_routeToCreateGroup'
  },

  initialize: function(opts) {
    if (!opts.rootUrl) throw new Error('rootUrl is required');

    this.model = new cdb.core.Model({
      view: 'groupsIndex'
    });

    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
  },

  normalizeFragmentOrUrl: function(fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  _routeToGroupsIndex: function() {
    this.model.set('view', 'groupsIndex');
  },

  _routeToCreateGroup: function() {
    this.model.set('view', 'createGroup');
  }

});
