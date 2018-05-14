const Backbone = require('backbone');
const $ = require('jquery');
const OrganizationModel = require('dashboard/data/organization-model');
const OrganizationUsersCollection = require('dashboard/data/organization-users-collection');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/organization-users-collection', function () {
  beforeEach(function () {
    this.org = new OrganizationModel({
      id: 'hello-org-id'
    }, { configModel });
    this.orgUsers = new OrganizationUsersCollection(
      null,
      {
        organization: this.org,
        currentUserId: 'current-user-id',
        configModel
      }
    );
    this.originalSync = this.orgUsers.sync;
    this.orgUsers.sync = function (a, b, opts) {};
  });

  it('should include sync abort', function () {
    expect(this.orgUsers.sync).not.toBeUndefined();
  });

  it('should parse results properly', function () {
    this.orgUsers.sync = function (a, b, opts) {
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

  it('should exclude current user from results', function () {
    this.orgUsers.sync = function (a, b, opts) {
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

  describe('when fetch is given data options', function () {
    beforeEach(function () {
      spyOn(Backbone, 'sync').and.returnValue($.Deferred());
      this.orgUsers.sync = this.originalSync;
      this.orgUsers.fetch({
        data: {
          page: 1,
          per_page: 77
        }
      });
    });

    it('should set them on the fetch URL', function () {
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

  describe('.totalCount', function () {
    it('should not be set initially', function () {
      expect(this.orgUsers.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function () {
      beforeEach(function () {
        this.orgUsers.sync = function (a, b, opts) {
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

      it('should have the total count set', function () {
        expect(this.orgUsers.totalCount()).toEqual(77);
      });
    });
  });

  function generateUser (id) {
    return {
      id: id || 'hello-id',
      username: 'user' + id,
      avatar_url: 'hi',
      base_url: 'base-url' + id
    };
  }
});
