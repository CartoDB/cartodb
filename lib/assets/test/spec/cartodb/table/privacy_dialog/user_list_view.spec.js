
describe('cdb.admin.UserOrgList', function() {

  var view, organization, permission, model;
  beforeEach(function() {
    permission = new cdb.admin.Permission();
    organization = new cdb.admin.Organization();
    model = new cdb.core.Model({ privacy: 'PUBLIC' });
    view = new cdb.admin.UserOrgList({
      permission:   permission,
      organization: organization,
      model:        model
    });
  });

  it("should render all the users", function() {
    var u1 = new cdb.admin.User({ username: 'test', id:'1' });
    var u2 = new cdb.admin.User({ username: 'test2', id:'2' });
    var u3 = new cdb.admin.User({ username: 'test3', id:'3' });
    permission.setPermission(u1, 'r');
    permission.setPermission(u2, 'rw');

    organization.users.add(u1);
    organization.users.add(u2);

    expect(view.render().$('li').length).toEqual(3); // 2 + "select all" = 3

    organization.users.add(u3);

    expect(view.$('li').length).toEqual(4);

    // check rendering
    var items = view.$('li');
    expect($(items[1]).find('p').html()).toEqual(u1.get('username'));
    expect($(items[1]).find('a.canwrite').hasClass('disabled')).toEqual(false);
    expect($(items[1]).find('a.canwrite').hasClass('enabled')).toEqual(false);
    expect($(items[2]).find('a.canwrite').hasClass('enabled')).toEqual(true);
  });

  it("should modify permissions", function() {
    var u1 = new cdb.admin.User({ username: 'test' });
    organization.users.add(u1);
    var userView = $(view.render().$('li')[1]);
    userView.find('a.canwrite').click();
    expect(permission.getPermission(u1)).toEqual('rw')
  });

  it("should have no leaks", function() {
     expect(view).toHaveNoLeaks();
  });

});
