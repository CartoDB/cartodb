
describe('cdb.admin.UserList', function() {

  var view, organization, permission;
  beforeEach(function() {
    permission = new cdb.admin.Permission();
    organization = new cdb.admin.Organization();
    view = new cdb.admin.UserList({
      permission: permission,
      organization: organization
    })
  });

  it("should render all the users", function() {
    var u1 = new cdb.admin.User({ username: 'test' });
    var u2 = new cdb.admin.User({ username: 'test2' });
    var u3 = new cdb.admin.User({ username: 'test3' });
    permission.setPermision(u1, 'r');
    permission.setPermision(u2, 'rw');
    organization.users.add(u1);
    organization.users.add(u2);

    expect(view.render().$('li').length).toEqual(2);

    organization.users.add(u3);

    expect(view.$('li').length).toEqual(3);

    // check rendering
    var items = view.$('li');
    expect($(items[0]).find('span').html()).toEqual(u1.get('username'));
    expect($(items[0]).find('a.canwrite').hasClass('disabled')).toEqual(true);
    expect($(items[0]).find('a.switch').hasClass('enabled')).toEqual(true);
    expect($(items[1]).find('a.canwrite').hasClass('enabled')).toEqual(true);

  });

  it("should modify permissions", function() {
    var u1 = new cdb.admin.User({ username: 'test' });
    organization.users.add(u1);
    var userView = $(view.render().$('li')[0]);
    userView.find('a.switch').click();
    expect(permission.permissionsForUser(u1)).toEqual('r')
    userView.find('a.canwrite').click();
    expect(permission.permissionsForUser(u1)).toEqual('rw')
  });

  it("should have no leaks", function() {
     expect(view).toHaveNoLeaks();
  });

});
