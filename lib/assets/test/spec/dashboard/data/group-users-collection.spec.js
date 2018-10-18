const $ = require('jquery');
const OrganizationGroupsCollection = require('dashboard/data/organization-groups-collection');
const GroupUsersCollection = require('dashboard/data/group-users-collection');

const configModel = require('fixtures/dashboard/config-model.fixture');
const userFixture = require('fixtures/dashboard/user-model.fixture');
const group = require('fixtures/dashboard/group-model.fixture');

describe('dashboard/data/group-users-collection', function () {
  beforeEach(function () {
    var user = userFixture();

    const organizationGroups = new OrganizationGroupsCollection(undefined, {
      organization: user.organization,
      configModel
    });
    this.group = group;
    this.group.collection = organizationGroups;
    this.groupUsers = new GroupUsersCollection(undefined, {
      group: this.group,
      configModel
    });
  });

  it('should create an empty users collection', function () {
    expect(this.groupUsers.length).toEqual(0);
  });

  describe('.addInBatch', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      spyOn($, 'ajax').and.callThrough();
      spyOn(this.groupUsers, 'fetch');
      this.result = this.groupUsers.addInBatch([1, 2, 3]);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '{}'
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should return a deferred object', function () {
      expect(this.result).toBeDefined();
      expect(this.result.done).toBeDefined();
      expect(this.result.fail).toBeDefined();
    });

    it('should make a POST call to add users to group', function () {
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.calls.argsFor(0)[0].type).toEqual('POST');
      expect($.ajax.calls.argsFor(0)[0].data).toEqual(jasmine.objectContaining({ users: [1, 2, 3] }));
    });

    it('should send password confirmation if available', function () {
      const passwordConfirmation = 'password';

      this.result = this.groupUsers.addInBatch([1, 2, 3], passwordConfirmation);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '{}'
      });

      expect($.ajax.calls.argsFor(1)[0].type).toEqual('POST');
      expect($.ajax.calls.argsFor(1)[0].data).toEqual(jasmine.objectContaining({
        users: [1, 2, 3],
        password_confirmation: passwordConfirmation
      }));
    });

    describe('when successfully added users', function () {
      it('should fetch collection to update to proper state', function () {
        expect(this.groupUsers.fetch).toHaveBeenCalled();
      });

      it('should not resolve promise just yet', function () {
        const isResolved = this.result.state() === 'resolved';
        expect(isResolved).toBe(false);
      });

      describe('when fetch succeeds', function () {
        beforeEach(function () {
          this.groupUsers.fetch.calls.argsFor(0)[0].success();
        });

        it('should resolved promise', function () {
          const isResolved = this.result.state() === 'resolved';
          expect(isResolved).toBe(true);
        });
      });

      describe('when fetch fails', function () {
        beforeEach(function () {
          this.groupUsers.fetch.calls.argsFor(0)[0].error();
        });

        it('should resolved promise', function () {
          const isResolved = this.result.state() === 'resolved';
          expect(isResolved).toBe(true);
        });
      });
    });
  });

  describe('.removeInBatch', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      spyOn($, 'ajax').and.callThrough();
      spyOn(this.groupUsers, 'fetch');
      this.groupUsers.reset([{id: 1}, {id: 2}, {id: 9000}]);
      this.result = this.groupUsers.removeInBatch([1, 2, 3]);
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should return a deferred object', function () {
      expect(this.result).toBeDefined();
      expect(this.result.done).toBeDefined();
      expect(this.result.fail).toBeDefined();
    });

    it('should make a POST call to add users to group', function () {
      expect($.ajax).toHaveBeenCalled();
      expect($.ajax.calls.argsFor(0)[0].type).toEqual('DELETE');
      expect($.ajax.calls.argsFor(0)[0].data).toEqual(jasmine.objectContaining({ users: [1, 2, 3] }));
    });

    it('should send password confirmation if available', function () {
      const passwordConfirmation = 'password';

      this.result = this.groupUsers.removeInBatch([1, 2, 3], passwordConfirmation);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '{}'
      });

      expect($.ajax.calls.argsFor(1)[0].type).toEqual('DELETE');
      expect($.ajax.calls.argsFor(1)[0].data).toEqual(jasmine.objectContaining({
        users: [1, 2, 3],
        password_confirmation: passwordConfirmation
      }));
    });

    describe('when successfully removed users', function () {
      beforeEach(function () {
        jasmine.Ajax.requests.mostRecent().respondWith({
          status: 200,
          responseText: '{}'
        });
      });

      it('should fetch collection to update to proper state', function () {
        expect(this.groupUsers.fetch).toHaveBeenCalled();
      });

      it('should not change collection until fetch is successfully returned', function () {
        expect(this.groupUsers.pluck('id')).toEqual([1, 2, 9000]);
      });

      it('should not resolved promise just yet', function () {
        const isResolved = this.result.state() === 'resolved';
        expect(isResolved).toBe(false);
      });

      describe('when fetch succeeds', function () {
        beforeEach(function () {
          this.groupUsers.fetch.calls.argsFor(0)[0].success();
        });

        it('should resolved promise', function () {
          const isResolved = this.result.state() === 'resolved';
          expect(isResolved).toBe(true);
        });
      });

      describe('when fetch fails', function () {
        beforeEach(function () {
          this.groupUsers.fetch.calls.argsFor(0)[0].error();
        });

        it('should remove users from collection, but might not be accurate state since fetch failed', function () {
          expect(this.groupUsers.pluck('id')).toEqual([9000]);
        });

        it('should resolved promise', function () {
          const isResolved = this.result.state() === 'resolved';
          expect(isResolved).toBe(true);
        });
      });
    });
  });

  describe('.totalCount', function () {
    it('should not be set initially', function () {
      expect(this.groupUsers.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function () {
      beforeEach(function () {
        this.groupUsers.sync = function (a, b, opts) {
          opts.success && opts.success({
            users: [
            ],
            total_user_entries: 77,
            total_entries: 0
          });
        };
        this.groupUsers.fetch();
      });

      it('should have the total count set', function () {
        expect(this.groupUsers.totalCount()).toEqual(77);
      });
    });
  });
});
