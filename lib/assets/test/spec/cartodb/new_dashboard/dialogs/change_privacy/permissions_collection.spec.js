var Permissions = require('new_dashboard/dialogs/change_privacy/permissions_collection');
var OrgPermission = require('new_dashboard/dialogs/change_privacy/org_permission_model');
var UserPermission = require('new_dashboard/dialogs/change_privacy/user_permission_model');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/dialogs/change_privacy/permissions_collection', function() {
  describe('.byPermission', function() {
    beforeEach(function() {
      this.createPermissions = function() {
        this.permissions = Permissions.byPermission(this.visPermission, this.currentUserOrg);
      }
    });
    
    describe('given there is at least one other person in the organization', function() {
      beforeEach(function() {
        this.visPermission = new cdbAdmin.Permission();
        this.currentUserOrg = new cdbAdmin.Organization({
          owner: this.owner,
          users: [{
            username: 'paco'
          }]
        });
        this.createPermissions();
      });

      it('should return an collection', function() {
        expect(this.permissions instanceof Permissions).toBeTruthy();
      });

      it('should return collection where first item is the organization itself', function() {
        expect(this.permissions.at(0) instanceof OrgPermission).toBeTruthy();
      });
    });
  });
  
  describe('.usersCount', function() {
    describe('given there are some user models', function() {
      beforeEach(function() {
        this.permissions = new Permissions([
          new OrgPermission(),
          new UserPermission(),
          new UserPermission(),
          new OrgPermission()
        ])
      });

      it('should return the count of user models', function() {
        expect(this.permissions.usersCount()).toEqual(2);
      });
    });
  });
});


