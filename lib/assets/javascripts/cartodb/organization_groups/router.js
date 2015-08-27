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
    'new/': '_routeToCreateGroup',

    // Edit settings for a group
    'edit/:id': '_routeToEditGroup',
    'edit/:id/': '_routeToEditGroup'
  },

  initialize: function(opts) {
    _.each(['rootUrl', 'groups'], function(name) {
      if (!opts[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new cdb.core.Model({
      view: 'groupsIndex'
    });
    this._groups = opts.groups;
    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
  },

  normalizeFragmentOrUrl: function(fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  _routeToGroupsIndex: function() {
    this._groups.fetch();
    this.model.set('view', 'groupsIndex');
  },

  _routeToCreateGroup: function() {
    this.model.set('view', 'createGroup');
  },

  _routeToEditGroup: function(id) {
    if (id) {
      this.model.set({
        view: 'editGroup',
        groupId: id
      });
    } else {
      this.navigate(''); // redirect to index if there's no id
    }
  }

});
