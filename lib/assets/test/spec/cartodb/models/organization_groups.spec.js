describe('cdb.admin.OrganizationGroups', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'http://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        id: 'myorg42',
        owner: {
          id: 123
        }
      }
    });

    this.groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
  });

  describe('.newGroupById', function() {
    describe('when the group with the given id is not yet loaded', function() {
      beforeEach(function() {
        this.group = this.groups.newGroupById('g1');
      });

      it('should return a group with the given id set', function() {
        expect(this.group.id).toEqual('g1');
      });

      it('should have a valid url under the organization', function() {
        // required to be able to fetch the group from the expected correct location
        var url = this.group.url();
        expect(url).toBeTruthy();
        expect(url).toMatch('organization/myorg42/groups/g1');
      });
    });

    describe('when group with given id already exists in collection', function() {
      beforeEach(function() {
        this.groups.add({
          id: 'g2',
          display_name: 'foobar'
        });
        this.group = this.groups.newGroupById('g2');
      });

      it('should return existing group', function() {
        expect(this.group).toBe(this.groups.first());
      });
    });
  });
});
