
describe('cdb.admin.Permission', function () {

  var model, user1, user2, org,owner;
  beforeEach(function () {
    owner = new cdb.admin.User({
      id: 'uuid_owner',
      username: 'owner'
    });
    model = new cdb.admin.Permission({ 
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

    org = new cdb.admin.Organization({
      id: 'org_uuid',
      users: [{
        id: 'uuid2',
        username: 'u2'
      }]
    })
    user2.organization = org
  });

  it("getPermission", function () {
    model.setPermission(user1, 'r');
    expect(model.getPermission(user1)).toEqual('r');

    model.setPermission(user1, 'rw');
    expect(model.getPermission(user1)).toEqual('rw');
    expect(model.getPermission(user2)).toEqual(null);
  });

  it("getPermission within org", function () {
    model.setPermission(org, 'rw');
    expect(model.getPermission(user1)).toEqual(null);
    expect(model.getPermission(user2)).toEqual('rw');
    model.setPermission(user2, 'r');
    expect(model.getPermission(user2)).toEqual('r');
    model.removePermission(user2);
    expect(model.getPermission(user2)).toEqual(null);
    //model.setPermission(user2, 'n');
    //expect(model.getPermission(user2)).toEqual('n');
  })

  it("setPermission for 0 users", function() {
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');

    expect( function() {
      model.setPermission()
    }).toThrow(new Error("can't apply permission, user undefined"));

    expect(model.getPermission(user1)).toEqual('r');
    expect(model.getPermission(user2)).toEqual('rw');
  });

  it("setPermission for an org", function() {
  });

  it("setPermission for only a user", function() {
    model.setPermission(user1, 'rw');
    expect(model.getPermission(user1)).toEqual('rw');
  });

  it("setPermission for several users", function() {
    var user3 = new cdb.admin.User({
      id: 'uuid3',
      username: 'u3'
    });
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'r');
    model.setPermission(user3, 'r');

    var users = new Backbone.Collection([user1, user2, user3]);

    expect(model.getPermission(user1)).toEqual('r');
    expect(model.getPermission(user2)).toEqual('r');
    expect(model.getPermission(user3)).toEqual('r');

    model.setPermission(users, 'rw');

    expect(model.getPermission(user1)).toEqual('rw');
    expect(model.getPermission(user2)).toEqual('rw');
    expect(model.getPermission(user3)).toEqual('rw');
  });

  it("removePermission for 0 users", function() {
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');

    expect( function() {
      model.removePermission()
    }).toThrow(new Error("can't remove permission, user undefined"));
    
    expect(model.getPermission(user1)).toEqual('r');
    expect(model.getPermission(user2)).toEqual('rw');
  });

  it("removePermission for several users", function() {
    var user3 = new cdb.admin.User({
      id: 'uuid3',
      username: 'u3'
    });
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');
    model.setPermission(user3, 'rw');

    var users = new Backbone.Collection([user1, user2, user3]);

    model.removePermission(users);

    expect(model.getPermission(user1)).toEqual(null);
    expect(model.getPermission(user2)).toEqual(null);
    expect(model.getPermission(user3)).toEqual(null);
  });

  it("removePermission for only a user", function() {
    model.setPermission(user1, 'r');
    model.removePermission(user1);
    expect(model.getPermission(user1)).toEqual(null);
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

  it("should raise exception setting wrong permission", function() {
    expect( function() {
      model.setPermission(user1, 'jaja');
    }).toThrow(new Error("invalid acl"));
    expect(model.acl.length).toEqual(0);
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
