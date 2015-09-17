describe('cdb.admin.Permission', function() {

  var model, user1, user2, org,owner;
  beforeEach(function () {
    this.owner = owner = new cdb.admin.User({
      id: 'uuid_owner',
      username: 'owner'
    });
    this.permission = model = new cdb.admin.Permission({
      owner: owner.toJSON(),
      entity: {
      id: 'test_id',
      type: 'vis'
      }
    });
    user1 = new cdb.admin.User({
      id: 'uuid',
      username: 'u1'
    });
    user2 = new cdb.admin.User({
      id: 'uuid2',
      username: 'u2'
    });

    this.organization = org = new cdb.admin.Organization({
      id: 'org_uuid',
      users: [{
        id: 'uuid2',
        username: 'u2'
      }]
    })
    user2.organization = org
  });

  describe('.isOwner', function() {
    it('should return true if given model is considered owner of item', function() {
      expect(this.permission.isOwner(user1)).toBe(false);
      expect(this.permission.isOwner({})).toBe(false);

      expect(this.permission.isOwner(this.owner)).toBe(true);
    });

    it('should return true if ids are not set for owner', function() {
      // otherwise there are tons of tests that fails randomly and stalls test suite
      this.permission.owner.unset('id');
      expect(this.permission.isOwner({})).toBe(true);
    });

    describe('when has no owner', function() {
      beforeEach(function() {
        this.permission.owner = undefined;
      });

      it('should return false when owner is not set', function() {
        expect(this.permission.isOwner(this.owner)).toBe(false);
      });
    });

    describe('when owner has no id', function() {
      beforeEach(function() {
        this.other = this.owner.clone();
        this.permission.owner.set('id', undefined);
      });

      it('should return false when owner has no id', function() {
        expect(this.permission.isOwner(this.other)).toBe(false);
      });
    });
  });

  describe('.grantAccess and .revokeAccess', function() {
    it('should raise exception trying to grant faulty access', function() {
      expect( function() {
        model.grantAccess(user1, 'foo');
      }).toThrow(new Error('foo is not a valid ACL access'));
      expect(model.acl.length).toEqual(0);
    });

    describe('when given an user', function() {
      beforeEach(function() {
        model.setPermission(user1, 'rw');
      });

      it('should add an ACL item', function() {
        expect(this.permission.acl.length).toEqual(1);
      });

      it('should have expected meta set on ACL item', function() {
        var aclItem = this.permission.acl.first();
        expect(aclItem.get('type')).toEqual('user');
        expect(aclItem.get('access')).toEqual('rw');
        expect(aclItem.get('entity')).toBe(user1);
      });

      describe('when revoking access', function() {
        beforeEach(function() {
          this.permission.revokeAccess(user1);
        });

        it('should remove the ACL entry', function() {
          expect(this.permission.acl.length).toEqual(0);
        });
      });
    });

    describe('when given multiple users', function() {
      beforeEach(function() {
        this.users = new Backbone.Collection([user1, user2]);
        this.permission.setPermission(this.users, 'r');
      });

      it('should add ACL items', function() {
        expect(this.permission.acl.length).toEqual(2);
        expect(this.permission.acl.pluck('type')).toEqual(['user', 'user']);
      });

      describe('when revoking access to given users', function() {
        beforeEach(function() {
          this.permission.revokeAccess(this.users.models);
        });

        it('should remove the ACL entries', function() {
          expect(this.permission.acl.length).toEqual(0);
        });
      });
    });
  });

  describe('.access', function() {
    beforeEach(function() {
      // Setup various scenarios
      this.groupX = new cdb.admin.Group({ id: 'gx' });
      this.permission.acl.add(this.permission._createACLItem(this.groupX, cdb.admin.Permission.READ_ONLY));
      this.groupA = new cdb.admin.Group({ id: 'ga' });
      this.permission.acl.add(this.permission._createACLItem(this.groupA, cdb.admin.Permission.READ_ONLY));
      this.groupB = new cdb.admin.Group({ id: 'gb' });
      this.permission.acl.add(this.permission._createACLItem(this.groupB, cdb.admin.Permission.READ_WRITE));
    });

    describe('when given faulty input', function() {
      it('should throw error', function() {
        expect(function() {
          model.access(null);
        }).toThrow(new Error('model is required to get access'))
      });
    });

    describe('when given owner', function() {
      it('should return the RW', function() {
        expect(this.permission.access(this.owner)).toEqual(cdb.admin.Permission.READ_WRITE);
      });
    });

    describe('when given a model w/o any access', function() {
      it('should return null if there is no access', function() {
        expect(this.permission.access(new cdb.core.Model())).toBe(null);
        expect(this.permission.access(user1)).toBe(null);
        expect(this.permission.access(user2)).toBe(null);
        expect(this.permission.access(new cdb.admin.Group())).toEqual(null);
      });
    });

    describe('when given a group', function() {
      describe('when given group has own access', function() {
        it('should return the corresponding access', function() {
          expect(this.permission.access(this.groupX)).toEqual(cdb.admin.Permission.READ_ONLY);
          expect(this.permission.access(this.groupA)).toEqual(cdb.admin.Permission.READ_ONLY);
          expect(this.permission.access(this.groupB)).toEqual(cdb.admin.Permission.READ_WRITE);
        });

        describe('when group is part of organization has more privileged access', function() {
          beforeEach(function() {
            this.permission.acl.add(this.permission._createACLItem(this.organization, cdb.admin.Permission.READ_WRITE));
            this.organization.groups.add(this.groupA);
          });

          it('should return organization access if it is more privileged', function() {
            expect(this.permission.access(this.groupA)).toEqual(cdb.admin.Permission.READ_WRITE);
          });
        });
      });

      describe('when group has no own access but is part of organization with access', function() {
        beforeEach(function() {
          this.permission.acl.add(this.permission._createACLItem(this.organization, cdb.admin.Permission.READ_WRITE));
          this.organization.groups.add(this.groupX);
        });

        it('should return the organization access', function() {
          expect(this.permission.access(this.groupX)).toEqual(cdb.admin.Permission.READ_WRITE);
        });
      });
    });

    describe('when given a user that has group access', function() {
      beforeEach(function() {
        user1.groups.push(this.groupA)
      });

      it('should return the access available', function() {
        expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_ONLY);
      });

      it('should return the access of the group the user is member of with most access', function() {
        user1.groups.push(this.groupB)
        expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_WRITE);
      });

      describe('when user has organization with READ_WRITE access', function() {
        beforeEach(function() {
          user1.organization = this.organization;
          this.permission.acl.add(this.permission._createACLItem(user1.organization, cdb.admin.Permission.READ_WRITE));
        });

        it('should return the organization access since it has precedence over groups', function() {
          expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_WRITE);
        });
      });

      describe('when user is part of organization users collection with READ_WRITE access', function() {
        beforeEach(function() {
          user1.organization = null;
          this.organization.users.add(user1);
          this.permission.acl.add(this.permission._createACLItem(this.organization, cdb.admin.Permission.READ_WRITE));
        });

        it('should return the organization access since it has precedence over groups', function() {
          expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_WRITE);
        });
      });

      describe('when user has organization READ_ONLY access', function() {
        beforeEach(function() {
          user1.organization = this.organization;
          this.permission.acl.add(this.permission._createACLItem(user1.organization, cdb.admin.Permission.READ_ONLY));
        });

        it('should return the own access when it is better', function() {
          expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_ONLY);
        });

        describe('when user has better access than organization', function() {
          beforeEach(function() {
            this.permission.acl.add(this.permission._createACLItem(user1, cdb.admin.Permission.READ_WRITE));
          });

          it('should return the own access', function() {
            expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_WRITE);
          });
        });

        describe('when user is also owner', function() {
          beforeEach(function() {
            this.permission.owner = user1;
          });

          it('should return the READ_WRITE', function() {
            expect(this.permission.access(user1)).toEqual(cdb.admin.Permission.READ_WRITE);
          });
        });
      });
    });
  });

  describe('.getPermission', function() {
    beforeEach(function() {
      spyOn(this.permission, 'access').and.returnValue('foobar');
      this.model = 'aModel';
      this.results = this.permission.getPermission(this.model);
    });

    it('should be deprecated, just calls .access internally', function() {
      expect(this.permission.access).toHaveBeenCalled();
      expect(this.permission.access).toHaveBeenCalledWith(this.model);
      expect(this.results).toEqual('foobar');
    });
  });

  describe('.setPermission', function() {
    beforeEach(function() {
      spyOn(this.permission, 'grantAccess');
      this.model = 'aModel';
      this.permission.setPermission(this.model, cdb.admin.Permission.READ_ONLY);
    });

    it('should be deprecated, just calls .grantAccess internally', function() {
      expect(this.permission.grantAccess).toHaveBeenCalled();
      expect(this.permission.grantAccess).toHaveBeenCalledWith(this.model, cdb.admin.Permission.READ_ONLY);
    });
  });

  describe('.removePermission', function() {
    beforeEach(function() {
      spyOn(this.permission, 'revokeAccess');
      this.model = 'aModel';
      this.permission.removePermission(this.model);
    });

    it('should be deprecated, just calls .grantAccess internally', function() {
      expect(this.permission.revokeAccess).toHaveBeenCalled();
      expect(this.permission.revokeAccess).toHaveBeenCalledWith(this.model);
    });
  });

  it("should parse owner and acl", function() {
    model = new cdb.admin.Permission({
      owner: {
        username: 'rambo'
      },
      acl: [
        {
          type: 'user',
          entity: {
            id: 'u1',
            username: 'u1',
          },
          access: 'r'
        },
        {
          type: 'user',
          entity: {
            id: 'u2',
            username: 'u2',
          },
          access: 'rw'
        }
      ]
    });

    expect(model.owner.get('username')).toEqual('rambo');
    expect(model.acl.length).toEqual(2);
    expect(model.acl.at(0).get('entity').get('username')).toEqual('u1');

  });

  it("toJSON", function() {
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');
    expect(model.toJSON()).toEqual({
      entity: {
        id: 'test_id',
        type: 'vis'
      },
      acl: [
        { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
        { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
      ]
    });
  });

  it("updates owner", function () {
    model.set('owner', { username: 'changed'});
    expect(model.owner.get('username')).toEqual('changed');
    model.set('acl', [
        { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
        { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
    ]);
    expect(model.acl.length).toEqual(2);
  });

  it("shouldn't trigger an acl reset change when acl is re-generated", function () {
    var count = 0;

    model.acl.bind('reset', function() {
      ++count
    });

    model.set('acl', [
      { type: 'user', entity: { id: 'uuid', username: 'u1', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'r' },
      { type: 'user', entity: { id: 'uuid2', username: 'u2', avatar_url : 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png' }, access: 'rw' }
    ]);

    expect(count).toEqual(0);
  });

  describe('.clone', function() {
    beforeEach(function() {
      model.set('id', 'abc-123', { silent: true });
      this.permission = model.clone();
    });

    it('should return a new Permission object', function() {
      expect(this.permission).not.toBe(model);
      expect(this.permission instanceof cdb.admin.Permission).toBeTruthy();
    });

    it('should contain the same attributes as the original permission', function() {
      expect(this.permission.owner).not.toBeUndefined();
      expect(this.permission.acl).not.toBeUndefined();
    });

    it('should not have an id set', function() {
      expect(this.permission.get('id')).toBeUndefined();
      expect(this.permission.get('id')).not.toEqual(model.get('id'));
    });
  });

  describe('.overwriteAcl', function() {
    beforeEach(function() {
      this.otherPermission = model.clone();
      this.otherPermission.setPermission(user1, 'r');
      this.otherPermission.setPermission(user2, 'rw');
      model.overwriteAcl(this.otherPermission);
    });

    it('should set the ACL list from other permission object', function() {
      expect(model.acl.models).toEqual(this.otherPermission.acl.models);
    });
  });

  describe('.canRead', function() {
    describe('given a model that has at least read access', function() {
      it('should return true', function() {
        model.setPermission(user1, 'r');
        expect(model.canRead(user1)).toBeTruthy();

        model.setPermission(user1, 'rw');
        expect(model.canRead(user1)).toBeTruthy();
      });
    });

    describe('given a model that has no access', function() {
      it('should return false', function() {
        model.removePermission(user1);
        expect(model.canRead(user1)).toBeFalsy();
      });
    });
  });

  describe('.canWrite', function() {
    describe('given a model that has both read and write access set', function() {
      it('should return true', function() {
        model.setPermission(user1, 'rw');
        expect(model.canWrite(user1)).toBeTruthy();
      });
    });

    describe('given a model that only has read access', function() {
      it('should return false', function() {
        model.setPermission(user1, 'r');
        expect(model.canWrite(user1)).toBeFalsy();
      });
    });

    describe('given a model that has no access', function() {
      it('should return false', function() {
        model.removePermission(user1);
        expect(model.canWrite(user1)).toBeFalsy();

      });
    });
  });
});
