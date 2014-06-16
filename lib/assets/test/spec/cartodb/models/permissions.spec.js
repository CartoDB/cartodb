
describe('cdb.admin.Permission', function () {

  var model, user1, user2;
  beforeEach(function () {
    model = new cdb.admin.Permission();
    user1 = new cdb.admin.User({
      id: 'uuid',
      username: 'u1'
    });
    user2 = new cdb.admin.User({
      id: 'uuid2',
      username: 'u2'
    });
  });

  it("permissionsForUser", function () {
    model.setPermission(user1, 'r');
    expect(model.permissionsForUser(user1)).toEqual('r');

    model.setPermission(user1, 'rw');
    expect(model.permissionsForUser(user1)).toEqual('rw');
    expect(model.permissionsForUser(user2)).toEqual(null);
  });

  it("setPermission for 0 users", function() {
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');

    expect( function() {
      model.setPermission()
    }).toThrow(new Error("can't apply permission, user undefined"));
    
    expect(model.permissionsForUser(user1)).toEqual('r');
    expect(model.permissionsForUser(user2)).toEqual('rw');
  });

  it("setPermission for only a user", function() {
    model.setPermission(user1, 'rw');
    expect(model.permissionsForUser(user1)).toEqual('rw');
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

    expect(model.permissionsForUser(user1)).toEqual('r');
    expect(model.permissionsForUser(user2)).toEqual('r');
    expect(model.permissionsForUser(user3)).toEqual('r');

    model.setPermission(users, 'rw');

    expect(model.permissionsForUser(user1)).toEqual('rw');
    expect(model.permissionsForUser(user2)).toEqual('rw');
    expect(model.permissionsForUser(user3)).toEqual('rw');
  });

  it("removePermission for 0 users", function() {
    model.setPermission(user1, 'r');
    model.setPermission(user2, 'rw');

    expect( function() {
      model.removePermission()
    }).toThrow(new Error("can't remove permission, user undefined"));
    
    expect(model.permissionsForUser(user1)).toEqual('r');
    expect(model.permissionsForUser(user2)).toEqual('rw');
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

    expect(model.permissionsForUser(user1)).toEqual(null);
    expect(model.permissionsForUser(user2)).toEqual(null);
    expect(model.permissionsForUser(user3)).toEqual(null);
  });

  it("removePermission for only a user", function() {
    model.setPermission(user1, 'r');
    model.removePermission(user1);
    expect(model.permissionsForUser(user1)).toEqual(null);
  });

  it("should parse owner and acl", function() {
    model = new cdb.admin.Permission({
      owner: {
        username: 'rambo'
      },
      acl: [
        {
          user: {
            username: 'u1',
          },
          type: 'r'
        },
        {
          user: {
            username: 'u2',
          },
          type: 'rw'
        }
      ]
    });

    expect(model.owner.get('username')).toEqual('rambo');
    expect(model.acl.length).toEqual(2);
    expect(model.acl.at(0).get('user').get('username')).toEqual('u1');

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
      acl: [
        { user: { id: 'uuid', username: 'u1' }, type: 'r' },
        { user: { id: 'uuid2', username: 'u2' }, type: 'rw' }
      ]
    });
  });

});
