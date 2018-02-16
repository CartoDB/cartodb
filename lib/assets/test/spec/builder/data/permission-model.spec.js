var PermissionModel = require('builder/data/permission-model');
var UserModel = require('builder/data/user-model');
var GroupModel = require('builder/data/group-model');
var OrganizationModel = require('builder/data/organization-model');

// PermissionModel exports won't play nicely
var READ_ONLY = 'r';
var READ_WRITE = 'rw';

describe('data/permission-model', function () {
  var model, user1, user2, owner;
  beforeEach(function () {
    this.owner = owner = new UserModel({
      id: 'uuid_owner',
      username: 'owner',
      viewer: false
    }, {
      configModel: 'c'
    });
    this.permission = model = new PermissionModel({
      owner: owner.toJSON(),
      entity: {
        id: 'test_id',
        type: 'vis'
      }
    }, {
      configModel: 'c'
    });

    user1 = new UserModel({
      id: 'uuid',
      username: 'u1',
      viewer: false
    }, {
      configModel: 'c'
    });

    this.organization = new OrganizationModel({
      id: 'org_uuid'
    }, {
      configModel: 'c'
    });

    user2 = new UserModel({
      id: 'uuid2',
      username: 'u2',
      viewer: false,
      organization: this.organization
    }, {
      configModel: 'c'
    });
  });

  describe('.isOwner', function () {
    it('should return true if given model is considered owner of item', function () {
      expect(this.permission.isOwner(user1)).toBe(false);
      expect(this.permission.isOwner({})).toBe(false);
      expect(this.permission.isOwner(this.owner)).toBe(true);
    });

    it('should return true if ids are not set for owner', function () {
      // otherwise there are tons of tests that fails randomly and stalls test suite
      this.permission.owner.unset('id');
      expect(this.permission.isOwner({})).toBe(true);
    });

    describe('when has no owner', function () {
      beforeEach(function () {
        this.permission.owner = undefined;
      });

      it('should return false when owner is not set', function () {
        expect(this.permission.isOwner(this.owner)).toBe(false);
      });
    });

    describe('when owner has no id', function () {
      beforeEach(function () {
        this.other = this.owner.clone();
      });

      it('should return false when owner has no id', function () {
        expect(this.permission.isOwner(this.other)).toBe(false);
      });
    });
  });

  describe('.revokeWriteAccess', function () {
    beforeEach(function () {
      spyOn(this.permission, 'grantReadAccess');
      this.permission.revokeWriteAccess(user1);
    });

    it('should downgrade to read access', function () {
      expect(this.permission.grantReadAccess).toHaveBeenCalled();
      expect(this.permission.grantReadAccess).toHaveBeenCalledWith(user1);
    });
  });

  describe('.revokeAccess', function () {
    describe('when model has own ACL item', function () {
      beforeEach(function () {
        this.permission.acl.add(this.permission._newAclItem(user1, READ_ONLY));
        this.permission.revokeAccess(user1);
      });

      it('should return the ACL item', function () {
        expect(this.permission.acl.length).toEqual(0);
      });
    });
  });

  // Test all can/has/grant-access methods at once, since they all depend on similar setups
  describe('access', function () {
    beforeEach(function () {
      // Setup various group scenarios for later use
      this.groupX = new GroupModel({ id: 'gx' }, { configModel: 'c' });
      this.permission.acl.add(this.permission._newAclItem(this.groupX, READ_ONLY));
      this.groupA = new GroupModel({ id: 'ga' }, { configModel: 'c' });
      this.permission.acl.add(this.permission._newAclItem(this.groupA, READ_ONLY));
      this.groupB = new GroupModel({ id: 'gb' }, { configModel: 'c' });
      this.permission.acl.add(this.permission._newAclItem(this.groupB, READ_WRITE));
    });

    describe('owner', function () {
      it('should have all access', function () {
        expect(this.permission.hasAccess(this.owner)).toBe(true);
        expect(this.permission.hasReadAccess(this.owner)).toBe(true);
        expect(this.permission.hasWriteAccess(this.owner)).toBe(true);
      });

      it('should be able to set any access', function () {
        expect(this.permission.canChangeReadAccess(this.owner)).toBe(true);
        expect(this.permission.canChangeWriteAccess(this.owner)).toBe(true);
      });
    });

    describe('user', function () {
      describe('w/o any access', function () {
        it('should not have any access', function () {
          expect(this.permission.hasAccess(user2)).toBe(false);
          expect(this.permission.hasReadAccess(user2)).toBe(false);
          expect(this.permission.hasWriteAccess(user2)).toBe(false);
        });

        it('should be able to set any access', function () {
          expect(this.permission.canChangeReadAccess(user2)).toBe(true);
          expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
        });
      });

      describe('with read access', function () {
        beforeEach(function () {
          this.permission.grantReadAccess(user2);
        });

        it('should have read access', function () {
          expect(this.permission.hasAccess(user2)).toBe(true);
          expect(this.permission.hasReadAccess(user2)).toBe(true);
          expect(this.permission.hasWriteAccess(user2)).toBe(false);
        });

        it('should be able to set any access', function () {
          expect(this.permission.canChangeReadAccess(this.owner)).toBe(true);
          expect(this.permission.canChangeWriteAccess(this.owner)).toBe(true);
        });
      });

      describe('with write access', function () {
        beforeEach(function () {
          this.permission.grantWriteAccess(user2);
        });

        it('should have both read+write access', function () {
          expect(this.permission.hasAccess(user2)).toBe(true);
          expect(this.permission.hasReadAccess(user2)).toBe(true);
          expect(this.permission.hasWriteAccess(user2)).toBe(true);
        });

        it('should be able to set any access', function () {
          expect(this.permission.canChangeReadAccess(this.owner)).toBe(true);
          expect(this.permission.canChangeWriteAccess(this.owner)).toBe(true);
        });
      });

      describe('is part of organization with read access', function () {
        beforeEach(function () {
          this.permission.grantReadAccess(this.organization);
        });

        it('should have read access', function () {
          expect(this.permission.hasAccess(user2)).toBe(true);
          expect(this.permission.hasReadAccess(user2)).toBe(true);
          expect(this.permission.hasWriteAccess(user2)).toBe(false);
        });

        it('should only be able to set write access if builder', function () {
          expect(this.permission.canChangeReadAccess(user2)).toBe(false);
          expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
        });

        it('should not be able to set write access if viewer', function () {
          user2.set({viewer: true});
          expect(this.permission.canChangeReadAccess(user2)).toBe(false);
          expect(this.permission.canChangeWriteAccess(user2)).toBe(false);
        });

        describe('when organization has write access', function () {
          beforeEach(function () {
            this.permission.grantWriteAccess(this.organization);
          });

          it('should have both read+write access', function () {
            expect(this.permission.hasAccess(user2)).toBe(true);
            expect(this.permission.hasReadAccess(user2)).toBe(true);
            expect(this.permission.hasWriteAccess(user2)).toBe(true);
          });

          it('should not be able to change any access', function () {
            expect(this.permission.canChangeReadAccess(user2)).toBe(false);
            expect(this.permission.canChangeWriteAccess(user2)).toBe(false);
          });
        });
      });

      describe('w/o own access but member of group with read access', function () {
        beforeEach(function () {
          user2.groups.add(this.groupA);
        });

        it('should have the group access', function () {
          expect(this.permission.hasAccess(user2)).toBe(true);
          expect(this.permission.hasReadAccess(user2)).toBe(true);
          expect(this.permission.hasWriteAccess(user2)).toBe(false);
        });

        it('should only be able to change write access', function () {
          expect(this.permission.canChangeReadAccess(user2)).toBe(false);
          expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
        });

        describe('member of multiple groups', function () {
          beforeEach(function () {
            user2.groups.add(this.groupB);
          });

          it('should have the most privileged access of the groups', function () {
            expect(this.permission.hasAccess(user2)).toBe(true);
            expect(this.permission.hasReadAccess(user2)).toBe(true);
            expect(this.permission.hasWriteAccess(user2)).toBe(true);
          });

          it('should not be able to change any access (since has write inherited)', function () {
            expect(this.permission.canChangeReadAccess(user2)).toBe(false);
            expect(this.permission.canChangeWriteAccess(user2)).toBe(false);
          });
        });

        describe('is also part of organization with read+write access', function () {
          beforeEach(function () {
            this.permission.grantWriteAccess(this.organization);
          });

          it('should return the organization access since it has precedence over groups', function () {
            expect(this.permission.hasAccess(user2)).toBe(true);
            expect(this.permission.hasReadAccess(user2)).toBe(true);
            expect(this.permission.hasWriteAccess(user2)).toBe(true);
          });

          it('should not be able to change any access (since has write inherited)', function () {
            expect(this.permission.canChangeReadAccess(user2)).toBe(false);
            expect(this.permission.canChangeWriteAccess(user2)).toBe(false);
          });
        });

        describe('is part of organization with read+write access', function () {
          beforeEach(function () {
            this.permission.grantWriteAccess(this.organization);
          });

          it('should return the organization access since it has precedence over groups', function () {
            expect(this.permission.hasAccess(user2)).toBe(true);
            expect(this.permission.hasReadAccess(user2)).toBe(true);
            expect(this.permission.hasWriteAccess(user2)).toBe(true);
          });

          it('should not be able to change any access (since has write inherited)', function () {
            expect(this.permission.canChangeReadAccess(user2)).toBe(false);
            expect(this.permission.canChangeWriteAccess(user2)).toBe(false);
          });
        });

        describe('is part of organization with read-only access', function () {
          beforeEach(function () {
            this.permission.grantReadAccess(this.organization);
          });

          it('should return the organization access', function () {
            expect(this.permission.hasAccess(user2)).toBe(true);
            expect(this.permission.hasReadAccess(user2)).toBe(true);
            expect(this.permission.hasWriteAccess(user2)).toBe(false);
          });

          it('should be able to change write access only', function () {
            expect(this.permission.canChangeReadAccess(user2)).toBe(false);
            expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
          });

          describe('has better access than organization', function () {
            beforeEach(function () {
              this.permission.grantWriteAccess(user2);
            });

            it('should have read+write access', function () {
              expect(this.permission.hasAccess(user2)).toBe(true);
              expect(this.permission.hasReadAccess(user2)).toBe(true);
              expect(this.permission.hasWriteAccess(user2)).toBe(true);
            });

            it('should be able to change access', function () {
              expect(this.permission.canChangeReadAccess(user2)).toBe(true);
              expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
            });
          });

          describe('is also owner', function () {
            beforeEach(function () {
              this.permission.owner = user2;
            });

            it('should have read+write access', function () {
              expect(this.permission.hasAccess(user2)).toBe(true);
              expect(this.permission.hasReadAccess(user2)).toBe(true);
              expect(this.permission.hasWriteAccess(user2)).toBe(true);
            });

            it('should be able to change access', function () {
              expect(this.permission.canChangeReadAccess(user2)).toBe(true);
              expect(this.permission.canChangeWriteAccess(user2)).toBe(true);
            });
          });
        });
      });
    });

    describe('group', function () {
      describe('with own access', function () {
        it('should have the expected access', function () {
          expect(this.permission.hasAccess(this.groupX)).toBe(true);
          expect(this.permission.hasReadAccess(this.groupX)).toBe(true);
          expect(this.permission.hasWriteAccess(this.groupX)).toBe(false);

          expect(this.permission.hasAccess(this.groupA)).toBe(true);
          expect(this.permission.hasReadAccess(this.groupA)).toBe(true);
          expect(this.permission.hasWriteAccess(this.groupA)).toBe(false);

          expect(this.permission.hasAccess(this.groupB)).toBe(true);
          expect(this.permission.hasReadAccess(this.groupB)).toBe(true);
          expect(this.permission.hasWriteAccess(this.groupB)).toBe(true);
        });
      });
    });
  });

  it('should parse owner and acl', function () {
    model = new PermissionModel({
      owner: {
        username: 'rambo'
      },
      acl: [
        {
          type: 'user',
          entity: {
            id: 'u1',
            username: 'u1'
          },
          access: 'r'
        },
        {
          type: 'user',
          entity: {
            id: 'u2',
            username: 'u2'
          },
          access: 'rw'
        }
      ]
    }, { configModel: 'c' });

    expect(model.owner.get('username')).toEqual('rambo');
    expect(model.acl.length).toEqual(2);
    expect(model.acl.at(0).get('entity').get('username')).toEqual('u1');
  });

  it('toJSON', function () {
    model.grantReadAccess(user1);
    model.grantWriteAccess(user2);
    expect(model.toJSON()).toEqual({
      entity: {
        id: 'test_id',
        type: 'vis'
      },
      acl: [
        { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
        { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
      ]
    });
  });

  it('updates owner', function () {
    model.set('owner', { username: 'changed' });
    expect(model.owner.get('username')).toEqual('changed');
    model.set('acl', [
      { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
      { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
    ]);
    expect(model.acl.length).toEqual(2);
  });

  it("shouldn't trigger an acl reset change when acl is re-generated", function () {
    var count = 0;

    model.acl.bind('reset', function () {
      ++count;
    });

    model.set('acl', [
      { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
      { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
    ]);

    expect(count).toEqual(0);
  });

  describe('.clone', function () {
    beforeEach(function () {
      model.set('id', 'abc-123', { silent: true });
      this.permission = model.clone();
    });

    it('should return a new Permission object', function () {
      expect(this.permission).not.toBe(model);
      expect(this.permission instanceof PermissionModel).toBeTruthy();
    });

    it('should contain the same attributes as the original permission', function () {
      expect(this.permission.owner).not.toBeUndefined();
      expect(this.permission.acl).not.toBeUndefined();
    });

    it('should not have an id set', function () {
      expect(this.permission.get('id')).toBeUndefined();
      expect(this.permission.get('id')).not.toEqual(model.get('id'));
    });
  });

  describe('.overwriteAcl', function () {
    beforeEach(function () {
      this.otherPermission = model.clone();
      this.otherPermission.grantReadAccess(user1);
      this.otherPermission.grantWriteAccess(user2);
      model.overwriteAcl(this.otherPermission);
    });

    it('should set the ACL list from other permission object', function () {
      expect(model.acl.models).toEqual(this.otherPermission.acl.models);
    });
  });
});
