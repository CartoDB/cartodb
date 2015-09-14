var PagedSearchModel = require('../common/paged_search_model');

if (typeof module !== 'undefined') {
  module.exports = {};
}

/**
 * this model contains information about the organization for
 * the current user and the users who are inside the organizacion.
 *
 * Attributes:
 *
 * - users: collection with user instances whithin the organization (see cdb.admin.Organization.Users
 *
 *
 */

cdb.admin.Organization = cdb.core.Model.extend({

  url: '/api/v1/org/',

  initialize: function(attrs, opts) {
    this.owner = new cdb.admin.User(this.get('owner'));
    this.users = new cdb.admin.Organization.Users(
      null, {
        organizationId: this.id,
        currentUserId: opts && opts.currentUserId
      }
    );

    this.display_email = ((typeof attrs) != 'undefined' && attrs != null && (typeof attrs.admin_email) != 'undefined') && attrs.admin_email != null && (attrs.admin_email == '' ? this.owner.email : attrs.admin_email);

    this.users.reset(this.get('users'));
    // make sure all the users have a reference to this organization
    var self = this;
    this.users.each(function (u) {
      u.organization = self;
    });

    this.grantables = new cdb.admin.Grantables(undefined, {
      organization: this,
      currentUserId: opts && opts.currentUserId
    });
  },

  fetch: function() {
    throw new Error("organization should not be fetch, should be static");
  },

  containsUser: function(user) {
    return !!this.users.find(function(u) {
      return u.id === user.id;
    })
  },

  viewUrl: function() {
    return new cdb.common.OrganizationUrl({
      base_url: this.get('base_url')
    })
  }

});

// helper to manage organization users
cdb.admin.Organization.Users = Backbone.Collection.extend({

  model: cdb.admin.User,

  url: function() {
    if (!this.organizationId) {
      throw new Error('Organization id is needed for fetching organization users');
    }
    return '/api/v1/organization/' + this.organizationId + '/users';
  },

  initialize: function(users, opts) {
    this.elder('initialize');
    this.organizationId = opts.organizationId;
    this.currentUserId = opts.currentUserId;
    PagedSearchModel.setupCollection(this, 'total_user_entries', {
      per_page: 50,
      order: 'username',
      q: ''
    });

    // Let's add abort behaviour
    this.sync = Backbone.syncAbort;
  },

  comparator: function(mdl) {
    return mdl.get('username');
  },

  parse: function(r) {
    return _.reduce(r.users, function(memo, user) {
      if (user.id !== this.currentUserId) {
        memo.push(user);
      } else {
        this.total_user_entries--;
        this.total_entries--;
      }
      return memo;
    }, [], this);
  },

  // @deprecated use .pagedSearch.set(data)
  setParameters: function(data) {
    this.params.set(data);
    return this;
  },

  // @deprecated use .pagedSearch.get(key)
  getParameter: function(key) {
    return this.params.get(key);
  },

  // @deprecated use .pagedSearch.get('totalCount')
  getTotalUsers: function() {
    return this.total_user_entries
  },

  // @deprecated use .pagedSearch.get('q')
  getSearch: function() {
    return this.getParameter('q');
  }

});
