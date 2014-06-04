
describe('cdb.admin.Permission', function () {

  var model, user1, user2;
  beforeEach(function () {
    model = new cdb.admin.Permission();
    user1 = new cdb.admin.User({
      username: 'u1'
    });
    user2 = new cdb.admin.User({
      username: 'u2'
    });
  });

  it("permissionsForUser", function () {
    model.setPermision(user1, 'r');
    expect(model.permissionsForUser(user1)).toEqual('r');

    model.setPermision(user1, 'rw');
    expect(model.permissionsForUser(user1)).toEqual('rw');
    expect(model.permissionsForUser(user2)).toEqual(null);
  });

  it("removePermission", function() {
    model.setPermision(user1, 'r');
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
      model.setPermision(user1, 'jaja');
    }).toThrow(new Error("invalid acl"));
    expect(model.acl.length).toEqual(0);
  })

});
