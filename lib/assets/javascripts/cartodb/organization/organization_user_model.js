
  /**
   *  Organization User model
   */


  cdb.admin.organization.User = cdb.core.Model.extend({

    defaults: {
      quota_in_bytes: 0
    },

    idAttribute: 'username',
    urlRoot: '/organization/users'
    
  });

