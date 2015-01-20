
describe('cdb.admin.User', function() {

  var user ;
  beforeEach(function() {
    user = new cdb.admin.User({
      id: 'uuid',
      organization: {}
    });
  });

  it("shouldn't set avatar_url is it comes with null value", function() {
    var user1 = new cdb.admin.User({ avatar_url: null })
    expect(user.get('avatar_url')).toBe('http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png')
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

  it("hasFeatureFlagEnabled", function () {
    var flagOK = 'test_flag';
    var feature_flags = [];
    feature_flags.push(flagOK);
    user.set('feature_flags',feature_flags);
    
    expect(user.featureEnabled(flagOK)).toEqual(true);
    expect(user.featureEnabled('flagWrong')).toEqual(false);
  });

  describe('.equals', function() {
    describe('given same user', function() {
      it('should return true', function() {
        expect(user.equals(user)).toBeTruthy();
      });
    });

    describe('given not same user', function() {
      it('should return false', function() {
        expect(user.equals(new cdb.admin.User())).toBeFalsy();
        expect(user.equals(new cdb.core.Model())).toBeFalsy();
      });
    });
  });

});
