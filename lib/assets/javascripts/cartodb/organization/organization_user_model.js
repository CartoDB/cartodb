
  /**
   *  Organization User model
   */


  cdb.admin.organization.User = cdb.core.Model.extend({

    idAttribute: 'username',
    urlRoot: '/organization/users'

  });

