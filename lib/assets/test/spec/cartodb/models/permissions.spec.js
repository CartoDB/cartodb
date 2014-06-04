
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

});
