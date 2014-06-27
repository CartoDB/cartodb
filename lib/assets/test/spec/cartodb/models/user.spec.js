
describe('cdb.admin.User', function() {

  var user ;
  beforeEach(function() {
    user = new cdb.admin.User({
      id: 'uuid',
      organization: {}
    });
  });

  it("isInsideOrg", function() {
    user.organization.users.reset([]);
    expect(user.isInsideOrg()).toEqual(false);
    user.organization.users.add(new cdb.admin.User());
    user.organization.users.add(new cdb.admin.User());
    expect(user.isInsideOrg()).toEqual(true);
  });

  it("isOrgAdmin", function() {
    user.organization.owner = user;
    expect(user.isOrgAdmin()).toEqual(true);
    user.organization.owner = new cdb.admin.User({
      id: 'test',
      organization: {}
    });
    expect(user.isOrgAdmin()).toEqual(false);
  });

});
