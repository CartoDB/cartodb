describe('cdb.admin.GroupUsers', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'http://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        id: 'o1',
        owner: {
          id: 123
        }
      }
    });
    var organizationGroups = new cdb.admin.OrganizationGroups(undefined, {
      organization: user.organization
    });
    this.group = new cdb.admin.Group({
      id: 'g1'
    });
    this.group.collection = organizationGroups
    this.groupUsers = new cdb.admin.GroupUsers(undefined, {
      group: this.group
    });
  });

  it('should create an empty users collection', function() {
    expect(this.groupUsers.length).toEqual(0);
  });

  describe('.addInBatch', function() {
    beforeEach(function() {
      this.server = sinon.fakeServer.create();
      spyOn($, 'ajax').and.callThrough();
      this.result = this.groupUsers.addInBatch([1,2,3]);
    });

    afterEach(function() {
      this.server.restore();
    });

    it('should return a deferred object', function() {
      expect(this.result).toBeDefined();
      expect(this.result.done).toBeDefined();
      expect(this.result.fail).toBeDefined();
    });

    it('should make a POST call to add users to group', function() {
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.calls.argsFor(0)[0].type).toEqual('POST');
    });
  });
});
