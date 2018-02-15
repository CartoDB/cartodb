var Backbone = require('backbone');
var OrganizationUrlModel = require('dashboard/data/organization-url-model');

describe('dashboard/data/organization-url-model', function () {
  var BASE_URL = 'http://wadus.com';
  var model = new OrganizationUrlModel({ base_url: BASE_URL });

  it('throws an error when base_url is missing', function () {
    var newModel = function () {
      return new OrganizationUrlModel({});
    };
    expect(newModel).toThrowError('base_url is required');
  });

  describe('.edit', function () {
    it('throws an error if user is missing', function () {
      expect(model.edit).toThrowError('User is needed to create the url');
    });

    it('creates a new url model with edit as base url', function () {
      var username = 'rick';
      var user = new Backbone.Model({ username: username });

      var editUrlModel = model.edit(user);

      expect(editUrlModel.get('base_url')).toEqual(BASE_URL + '/' + username + '/edit');
    });
  });

  describe('.create', function () {
    it('creates a new url model with new as base url', function () {
      var createUrlModel = model.create();

      expect(createUrlModel.get('base_url')).toEqual(BASE_URL + '/new');
    });
  });

  describe('.groups', function () {
    it('creates a new url model with groups as base url', function () {
      var createUrlModel = model.groups();

      expect(createUrlModel.get('base_url')).toEqual(BASE_URL + '/groups');
    });
  });
});
