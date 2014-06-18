
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
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    organization.users.add(u1);
    var userView = $(view.render().$('li')[1]);
    userView.find('a.canwrite').click();
    expect(permission.getPermission(u1)).toEqual('rw')
  });

  it("should show read-only switches when vis privacy is ORGANIZATION", function() {
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
    view.render();

    var $org_item = view.$('li:eq(0)');
    var $user_item = view.$('li:eq(1)');

    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();

    // Disable user, organization still enabled
    $user_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();

    // Disable organization, user still disabled
    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();

    // Enable organization, user should be disabled
    $org_item.find('a.canwrite').click();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeFalsy();
    expect(permission.getPermission(u1)).toBe('r');
  });

  it("should set properly permissions within organization privacy", function() {
    var u1 = new cdb.admin.User({ username: 'test', id: '1' });
    var u2 = new cdb.admin.User({ username: 'test', id: '2' });
    var u3 = new cdb.admin.User({ username: 'test', id: '3' });
    organization.users.add(u1);
    organization.users.add(u2);
    organization.users.add(u3);
    model.set('privacy', 'ORGANIZATION');
    view.render();

    var $org_item = view.$('li:eq(0)');
    var $user_item = view.$('li:eq(1)');
    var $user_item2 = view.$('li:eq(2)');
    var $user_item3 = view.$('li:eq(3)');

    // Can write can't be enabled when permission is n or empty
    $org_item.find('a.canwrite').click();    
    expect($user_item.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($user_item2.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($user_item3.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($org_item.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($user_item.find('a.switch').hasClass('enabled')).toBeFalsy();
    expect($org_item.find('a.switch').hasClass('enabled')).toBeFalsy();
    expect(permission.getPermission(u1)).toBe(null);
    expect(permission.getPermission(u2)).toBe(null);
    expect(permission.getPermission(u3)).toBe(null);

    // If org enables r permission (without any user in the acl), all users should be enabled, but now with rw permission
    $org_item.find('a.switch').click();
    expect($user_item.find('a.canwrite').hasClass('disabled enabled')).toBeFalsy();
    expect($user_item2.find('a.canwrite').hasClass('disabled enabled')).toBeFalsy();
    expect($user_item3.find('a.canwrite').hasClass('disabled enabled')).toBeFalsy();
    expect($org_item.find('a.canwrite').hasClass('disabled enabled')).toBeFalsy();
    expect($user_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('r');
    expect(permission.getPermission(u2)).toBe('r');
    expect(permission.getPermission(u3)).toBe('r');

    // If org enables rw permission (without any user in the acl), all users should be enabled, but now with rw permission
    $org_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('rw');
    expect(permission.getPermission(organization)).toBe('rw');

    // User change shouldn't change any other user permission
    $user_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('enabled disabled')).toBeFalsy();
    expect($user_item2.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item3.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.canwrite').hasClass('enabled')).toBeTruthy();
    expect($user_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect($user_item2.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect($user_item3.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect($org_item.find('a.switch').hasClass('enabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('r');
    expect(permission.getPermission(u2)).toBe('rw');
    expect(permission.getPermission(u3)).toBe('rw');
    expect(permission.getPermission(organization)).toBe('rw');

    // User without permissions should have 'n' permission
    $user_item.find('a.switch').click();
    expect($user_item.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($user_item.find('a.switch').hasClass('disabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('n');
    expect(permission.getPermission(u2)).toBe('rw');
    expect(permission.getPermission(u3)).toBe('rw');
    expect(permission.getPermission(organization)).toBe('rw');

    // User with 'n' permission shouldn't enable write permission
    $user_item.find('a.canwrite').click();
    expect($user_item.find('a.canwrite').hasClass('disabled')).toBeTruthy();
    expect($user_item.find('a.switch').hasClass('disabled')).toBeTruthy();
    expect(permission.getPermission(u1)).toBe('n');
  });


  it("should have no leaks", function() {
     expect(view).toHaveNoLeaks();
  });

});
