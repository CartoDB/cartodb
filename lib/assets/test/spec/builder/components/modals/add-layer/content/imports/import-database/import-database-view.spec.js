const _ = require('underscore');
const Backbone = require('backbone');
const ImportDatabaseView = require('builder/components/modals/add-layer/content/imports/import-database/import-database-view');
const AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
const userModel = require('fixtures/builder/user-model.fixture');
const configModel = require('fixtures/builder/config-model.fixture');

describe('components/modals/add-layer/content/imports/import-database/import-database-view', function () {
  const privacyModel = new Backbone.Model();
  const guessingModel = new Backbone.Model();
  const _userModel = userModel({});
  const _configModel = configModel({});
  const createModel = new AddLayerModel({}, {
    userModel: _userModel,
    configModel: _configModel,
    userActions: {},
    pollingModel: new Backbone.Model()
  });

  const params = [
    { key: 'server', type: 'text' },
    { key: 'port', type: 'number' },
    { key: 'database', type: 'text' },
    { key: 'username', type: 'text' },
    { key: 'password', type: 'password' }
  ];
  const importOptions = { name: 'postgresql', title: 'PostgreSQL', type: 'database', placeholder_query: 'SELECT * FROM table', params };

  describe('render', function () {
    beforeEach(function () {
      this.view = new ImportDatabaseView(
        _.extend(
          importOptions,
          {
            userModel: _userModel,
            configModel: _configModel,
            createModel: createModel,
            privacyModel: privacyModel,
            guessingModel: guessingModel,
            service: 'databaseconnector'
          }
        )
      );
      this.view.render();
    });

    it('should be rendered properly', function () {
      expect(this.view.$('.ImportPanel-connectForm').length).toBe(1);
    });
  });
});
