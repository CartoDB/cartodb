describe('cdb.admin.GroupUsers', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'https://carto.com/user/paco',
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
      expect($.ajax.calls.argsFor(0)[0].data).toEqual(jasmine.objectContaining({ users: [1,2,3] }));
    });

    describe('when successfully added users', function() {
      beforeEach(function() {
        spyOn(this.groupUsers, 'fetch');
        this.server.respond('200');
      });

      it('should fetch collection to update to proper state', function() {
        expect(this.groupUsers.fetch).toHaveBeenCalled();
      });

      it('should not resolve promise just yet', function() {
        expect(this.result.isResolved()).toBe(false);
      });

      describe('when fetch succeeds', function() {
        beforeEach(function() {
          this.groupUsers.fetch.calls.argsFor(0)[0].success();
        });

        it('should resolved promise', function() {
          expect(this.result.isResolved()).toBe(true);
        });
      });

      describe('when fetch fails', function() {
        beforeEach(function() {
          this.groupUsers.fetch.calls.argsFor(0)[0].error();
        });

        it('should resolved promise', function() {
          expect(this.result.isResolved()).toBe(true);
        });
      });
    });
  });

  describe('.removeInBatch', function() {
    beforeEach(function() {
      this.server = sinon.fakeServer.create();
      spyOn($, 'ajax').and.callThrough();
      this.groupUsers.reset([{id: 1}, {id: 2}, {id: 9000}])
      this.result = this.groupUsers.removeInBatch([1,2,3]);
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
      expect($.ajax.calls.argsFor(0)[0].type).toEqual('DELETE');
      expect($.ajax.calls.argsFor(0)[0].data).toEqual(jasmine.objectContaining({ users: [1,2,3] }));
    });

    describe('when successfully removed users', function() {
      beforeEach(function() {
        spyOn(this.groupUsers, 'fetch');
        this.server.respond('200');
      });

      it('should fetch collection to update to proper state', function() {
        expect(this.groupUsers.fetch).toHaveBeenCalled();
      });

      it('should not change collection until fetch is successfully returned', function() {
        expect(this.groupUsers.pluck('id')).toEqual([1, 2, 9000]);
      });

      it('should not resolved promise just yet', function() {
        expect(this.result.isResolved()).toBe(false);
      });

      describe('when fetch succeeds', function() {
        beforeEach(function() {
          this.groupUsers.fetch.calls.argsFor(0)[0].success();
        });

        it('should resolved promise', function() {
          expect(this.result.isResolved()).toBe(true);
        });
      });

      describe('when fetch fails', function() {
        beforeEach(function() {
          this.groupUsers.fetch.calls.argsFor(0)[0].error();
        });

        it('should remove users from collection, but might not be accurate state since fetch failed', function() {
          expect(this.groupUsers.pluck('id')).toEqual([9000]);
        });

        it('should resolved promise', function() {
          expect(this.result.isResolved()).toBe(true);
        });
      });
    });
  });

  describe('.totalCount', function() {
    it('should not be set initially', function() {
      expect(this.groupUsers.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function() {
      beforeEach(function() {
        this.groupUsers.sync = function(a,b,opts) {
          opts.success && opts.success({
            users: [
            ],
            total_user_entries: 77,
            total_entries: 0
          });
        };
        this.groupUsers.fetch();
      });

      it('should have the total count set', function() {
        expect(this.groupUsers.totalCount()).toEqual(77);
      });
    });
  });
});
