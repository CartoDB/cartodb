
describe('cdb.admin.Organization', function() {

  beforeEach(function() {
    this.organization = new cdb.admin.Organization({
      id: "68a57d79-d454-4b28-8af8-968e97b1349c",
      seats: 5,
      quota_in_bytes: 1234567890,
      created_at: "2014-06-05T16:34:51+02:00",
      updated_at: "2014-06-05T16:34:51+02:00",
      name: "orgtest3",
      owner: { id: "4ab67a64-7cbf-4890-88b8-9d3c398249d5", username: "dev", avatar_url: null },
      users:[]
    });

  });

  it("should have owner", function() {
    expect(this.organization.owner.get('username')).toEqual('dev');
  });

  it("should have a users collection attribute", function() {
    expect(this.organization.users).not.toBeUndefined();
  });

  it("all collections should have reference to the organization", function() {
    var newOrg = new cdb.admin.Organization({
      id: "68a57d79-d454-4b28-8af8-968e97b1349c",
      seats: 5,
      quota_in_bytes: 1234567890,
      created_at: "2014-06-05T16:34:51+02:00",
      updated_at: "2014-06-05T16:34:51+02:00",
      name: "orgtest3",
      owner: { id: "4ab67a64-7cbf-4890-88b8-9d3c398249d5", username: "dev", avatar_url: null },
      users: [
        {id: "b6551618-9544-4f22-b8ba-2242d6b20733", "username":"t2", "avatar_url":null},
        {id: "5b514d61-fb7a-4b9b-8a0a-3fdb82cf79ca", "username":"t1", "avatar_url":null}
      ],
      groups: [
        {id: 'g1'},
        {id: 'g2'},
      ]
    })
    expect(newOrg.users.organization).toEqual(newOrg);
    expect(newOrg.groups.organization).toEqual(newOrg);
    expect(newOrg.grantables.organization).toEqual(newOrg);
  });
});

describe('cdb.admin.Organization.Users', function() {

  beforeEach(function() {
    this.org = new cdb.admin.Organization({
      id: 'hello-org-id'
    });
    this.orgUsers = new cdb.admin.Organization.Users(
      null,
      {
        organization: this.org,
        currentUserId: 'current-user-id'
      }
    );
    this.originalSync = this.orgUsers.sync;
    this.orgUsers.sync = function(a, b, opts) {}
  });

  it("should include sync abort", function() {
    expect(this.orgUsers.sync).not.toBeUndefined();
  });

  it("should parse results properly", function() {
    this.orgUsers.sync = function(a,b,opts) {
      opts.success && opts.success({
        users: [
          generateUser()
        ],
        total_user_entries: 1,
        total_entries: 1
      });
    };
    this.orgUsers.fetch();
    expect(this.orgUsers.length).toBe(1);
    expect(this.orgUsers.total_user_entries).toBe(1);
    expect(this.orgUsers.total_entries).toBe(1);
  });

  it("should exclude current user from results", function() {
    this.orgUsers.sync = function(a,b,opts) {
      opts.success && opts.success({
        users: [
          generateUser('current-user-id'),
          generateUser()
        ],
        total_user_entries: 2,
        total_entries: 2
      });
    };
    this.orgUsers.fetch();
    expect(this.orgUsers.length).toBe(1);
    expect(this.orgUsers.total_user_entries).toBe(1);
    expect(this.orgUsers.total_entries).toBe(1);
  });

  describe('when fetch is given data options', function() {
    beforeEach(function() {
      spyOn(Backbone, 'sync').and.returnValue($.Deferred());
      this.orgUsers.sync = this.originalSync;
      this.orgUsers.fetch({
        data: {
          page: 1,
          per_page: 77,
        }
      });
    });

    it('should set them on the fetch URL', function() {
      expect(Backbone.sync).toHaveBeenCalled();
      var opts = Backbone.sync.calls.argsFor(0)[2];
      expect(opts).toEqual(
        jasmine.objectContaining({
          data: {
            page: 1,
            per_page: 77
          }
        })
      );
    });
  });

  describe('.totalCount', function() {
    it('should not be set initially', function() {
      expect(this.orgUsers.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function() {
      beforeEach(function() {
        this.orgUsers.sync = function(a,b,opts) {
          opts.success && opts.success({
            users: [
              generateUser()
            ],
            total_user_entries: 77,
            total_entries: 1
          });
        };
        this.orgUsers.fetch();
      });

      it('should have the total count set', function() {
        expect(this.orgUsers.totalCount()).toEqual(77);
      });
    });
  });

  function generateUser(id) {
    return {
      id: id || "hello-id",
      username: "user" + id,
      avatar_url: "hi",
      base_url: "base-url" + id
    }
  }

});
