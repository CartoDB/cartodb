This document contains some notes on how to work with backbone models related to organization

## Models related to organization

- [cdb.admin.User](https://github.com/CartoDB/cartodb/blob/CDB-2891/lib/assets/javascripts/cartodb/models/user.js): it already existed, but it takes more importance
- [cdb.admin.Organization](https://github.com/CartoDB/cartodb/blob/CDB-2891/lib/assets/javascripts/cartodb/models/organization.js): this represents an organization
- [cdb.admin.Permission](https://github.com/CartoDB/cartodb/blob/CDB-2891/lib/assets/javascripts/cartodb/models/permissions.js): permission object, contains the information to know about the ownership and
  permission list (called ``acl``) of an object. See https://github.com/Vizzuality/cartodb-management/wiki/multiuser-REST-API#permissions-object

### Changes

- ``User`` model has an organization attribute. Each user is **always** inside an organization, so
  this will be always filled. When the organization contains only a user, the application behavior is the
  same than we currently have (CartoDB 2.0)

- ``Visualization`` object contains a ``permission`` attribute (instance of ``cdb.admin.Permission``)


### How to use them

- add read permissions to a table

```
canonical_visualization.permission.setPermission(user_model, 'r').save();
```

- add read/write permissions to a table
```
canonical_visualization.permission.setPermission(user_model, 'rw').save();
```

- how to know if the organization for the current user is single or multiuser
```
user.isInsideOrg()
user.isAdminOrg()
```

- know what users have access to a visualization

```
vis.permission.acl.each(function(aclItem) {
    console.log("user " + aclItem.get('user').get('username') + " permission: " + aclItem.get('type'))
})
```

- know the owner of a visualization
```
// owner is a cdb.admin.User instance
vis.permission.owner.get('username')
```


