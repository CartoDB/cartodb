describe('cdb.admin.Grantables', function () {
  beforeEach(function() {
    this.org = new cdb.admin.Organization({
      id: 'o1'
    });
    this.grantables = new cdb.admin.Grantables(undefined, {
      organization: this.org
    });
  });

  it('should have a working URL', function() {
    expect(this.grantables.url()).toMatch('/organization/o1/grantables');
  });

  describe('when is fetched', function() {
    beforeEach(function() {
      this.grantables.sync = function(a,b,opts) {
        opts.success && opts.success({
          "grantables":[{
            "id":"u1",
            "type":"user",
            "name":"an user",
            "avatar_url":"images/avatars/avatar_marker_red.png",
            "model": {
              "id":"u1",
              "username":"foo",
              // …
            },
          }, {
            "id":"g1",
            "type":"group",
            "name":"my group",
            "avatar_url":"avatar_marker_red.png",
            "model": {
              "id":"g1",
              "display_name":"my group",
              "name":"my_group",
              // …
            },
          }],
          "total_entries": 2,
          "total_org_entries": 2
        });
      };
      this.grantables.fetch();
    });

    it('should parse response and set grantables model', function() {
      expect(this.grantables.length).toEqual(2);
      expect(this.grantables.first().id).toEqual('u1');
    });
  });
});
