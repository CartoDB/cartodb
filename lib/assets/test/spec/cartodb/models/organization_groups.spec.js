describe('cdb.admin.OrganizationGroups', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'https://carto.com/user/paco',
      username: 'paco',
      organization: {
        id: 'myorg42',
        owner: {
          id: 123
        }
      }
    });
    this.org = user.organization;

    this.groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
  });

  it('should set organization', function() {
    expect(this.groups.organization).toBe(this.org);
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

      it('should set collection on group', function() {
        expect(this.group.collection).toBe(this.groups);
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
        expect(this.group.collection).toBe(this.groups);
      });
    });
  });

  describe('when groups is fetched', function() {
    beforeEach(function() {
      this.groups.sync = function(a,b,opts) {
        opts.success && opts.success({
          groups: [{
            id: 'g1'
          }],
          total_entries: 1
        });
      }
      this.groups.fetch();
    });

    it('should set organization on group objects', function() {
      expect(this.groups.length).toEqual(1);
    });

    it('should have a total_entries prop set', function() {
      expect(this.groups.total_entries).toEqual(1);
    });
  });


  describe('.totalCount', function() {
    it('should not be set initially', function() {
      expect(this.groups.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function() {
      beforeEach(function() {
        this.groups.sync = function(a,b,opts) {
          opts.success && opts.success({
            groups: [{
              id: 'g1'
            }],
            total_entries: 1
          });
        };
        this.groups.fetch();
      });

      it('should have the total count set', function() {
        expect(this.groups.totalCount()).toEqual(1);
      });
    });
  });
});
