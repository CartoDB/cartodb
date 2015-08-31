var cdb = require('cartodb.js');
var Router = require('../common/router');

/**
 *  Backbone router for organization groups urls.
 */
module.exports = Router.extend({

  routes: {

    // Groups index
    '': 'routeToGroupsIndex',

    // If URL is lacking the trailing slash (e.g. 'http://username.cartodb.com/organization/groups'), treat it like index
    'groups': 'routeToGroupsIndex',
    '*prefix/groups': 'routeToGroupsIndex',

    // Create a new group
    'new': 'routeToCreateGroup',
    'new/': 'routeToCreateGroup',

    // Show group details
    ':id': 'routeToShowGroup',
    ':id/': 'routeToShowGroup',

    // Edit settings for a group
    ':id/edit': 'routeToEditGroup',
    ':id/edit/': 'routeToEditGroup'
  },

  initialize: function(opts) {
    _.each(['rootUrl', 'groups'], function(name) {
      if (!opts[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new cdb.core.Model({
      viewName: 'groupsIndex'
    });
    this._groups = opts.groups;
    this.rootUrl = opts.rootUrl;
    this.rootPath = this.rootUrl.pathname.bind(this.rootUrl);
  },

  normalizeFragmentOrUrl: function(fragmentOrUrl) {
    return fragmentOrUrl ? fragmentOrUrl.toString().replace(this.rootUrl.toString(), '') : '';
  },

  routeToGroupsIndex: function() {
    this._groups.fetch({
      data: {
        fetch_members: true
      }
    });
    this.model.set('viewName', 'groupsIndex');
  },

  routeToCreateGroup: function() {
    this.model.set('viewName', 'createGroup');
  },

  routeToShowGroup: function(id) {
    this._setGroupView('showGroup', id);
  },

  routeToEditGroup: function(id) {
    this._setGroupView('editGroup', id);
  },

  _setGroupView: function(viewName, id) {
    if (id) {
      this.model.set({
        viewName: viewName,
        groupId: id
      });
    } else {
      this.navigate(''); // redirect to index if there's no id
    }
  }

});
