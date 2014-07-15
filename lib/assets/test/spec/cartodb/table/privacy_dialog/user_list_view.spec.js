
describe('cdb.admin.UserOrgList', function() {

  var view, organization, permission, model;
  beforeEach(function() {
    permission = new cdb.admin.Permission({
      owner: {
        id: 'uuid_owner'
      }
      
    });
    organization = new cdb.admin.Organization();

/*
    organization.users.add(
      new cdb.admin.User({
        id: 'uuid2',
        username: 'uasd'
      })
    );
    */
    user = new cdb.admin.User({
      id: 'uuid',
      username: 'uasd'
    });
    user.organization = organization
    model = new cdb.core.Model({ privacy: 'PUBLIC' });
    model.set('related_tables', new Backbone.Collection());
    view = new cdb.admin.UserOrgList({
      permission:   permission,
      user: user,
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
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    organization.users.add(u1);
    var userView = $(view.render().$('li')[1]);
    userView.find('a.canwrite').click();
    expect(permission.getPermission(u1)).toEqual('rw')
  });

  xit("should show read-only switches when vis privacy is ORGANIZATION", function() {
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    organization.users.add(u1);
    var $item = $(view.render().$('li')[1]);
    expect($item.find('a.switch').length).toEqual(0);

    model.set('privacy', 'ORGANIZATION');
    $item = $(view.render().$('li')[1]);
    expect($item.find('a.switch').length).toEqual(1);

    model.set('privacy', 'LINK');
    $item = $(view.render().$('li')[1]);
    expect($item.find('a.switch').length).toEqual(0);
  });

  it("should set enable write permissions when organization by default is enabled and acl is empty", function() {
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    organization.users.add(u1);
    u1.organization = organization;
    view.render();

    var $org_item = view.$('li:eq(0)');
    var $user_item = view.$('li:eq(1)');

    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('rw');
    expect(permission.getPermission(organization)).toBe('rw');

    // Disable user, organization should be disabled
    $user_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();
    expect(permission.getPermission(u1)).toBe('r');
    expect(permission.getPermission(organization)).toBe(null);

    // Enabled organization, user should be enabled
    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('rw');
  });

  it("should set properly permissions within organization privacy", function() {
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    var u2 = new cdb.admin.User({ username: 'test', id: '2' });
    var u3 = new cdb.admin.User({ username: 'test', id: '3' });
    organization.users.add(u1);
    organization.users.add(u2);
    organization.users.add(u3);
    u1.organization = organization;
    u2.organization = organization;
    u3.organization = organization;

    model.set('privacy', 'ORGANIZATION');
    view.render();

    var $org_item = view.$('li:eq(0)');
    var $user_item = view.$('li:eq(1)');
    var $user_item2 = view.$('li:eq(2)');
    var $user_item3 = view.$('li:eq(3)');

    // Can write can't be enabled when permission is n or empty
    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('disabled')).toEqual(false);
    expect($user_item2.find('a.canwrite').hasClass('disabled')).toEqual(false);
    expect($user_item3.find('a.canwrite').hasClass('disabled')).toEqual(false);
    expect($org_item.find('a.canwrite').hasClass('disabled')).toEqual(false);
    expect($user_item.find('a.switch').hasClass('enabled')).toEqual(true);
    expect($org_item.find('a.switch').hasClass('enabled')).toEqual(true);

    expect(permission.getPermission(u1)).toBe('rw');
    expect(permission.getPermission(u2)).toBe('rw');
    expect(permission.getPermission(u3)).toBe('rw');

    $org_item.find('a.canwrite').click();
    //$org_item.find('a.switch').click();

    expect(permission.getPermission(u1)).toBe('r');

    // User change shouldn't change any other user permission
    $user_item.find('a.canwrite').click();
    expect(permission.getPermission(u1)).toBe('rw');
    expect(permission.getPermission(u2)).toBe('r');
    expect(permission.getPermission(u3)).toBe('r');

    $org_item.find('a.canwrite').click();
    expect(permission.getPermission(u1)).toBe('rw');
    expect(permission.getPermission(u2)).toBe('rw');
    expect(permission.getPermission(u3)).toBe('rw');

    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item2.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item3.find('a.canwrite').hasClass('enabled')).toBeTruthy();
  });

  it("should not enable write checks for visualizations", function() {
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    organization.users.add(u1);
    view.render();
    expect(view.$('a.canwrite').length).not.toEqual(0);
    view = new cdb.admin.UserOrgList({
      permission:   permission,
      user: user,
      model: model,
      writePermissionEnabled: false
    });
    view.render();
    expect(view.$('a.canwrite').length).toEqual(0);
  });


  it("should have no leaks", function() {
     expect(view).toHaveNoLeaks();
  });

});
