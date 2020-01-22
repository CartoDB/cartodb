var _ = require('underscore');
var Backbone = require('backbone');
var ImportDatabaseView = require('builder/components/modals/add-layer/content/imports/import-database/import-database-view');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
var userModel = require('fixtures/builder/user-model.fixture');
var configModel = require('fixtures/builder/config-model.fixture');

describe('components/modals/add-layer/content/imports/import-database/import-database-view', function () {
  var privacyModel = new Backbone.Model();
  var guessingModel = new Backbone.Model();
  var _userModel = userModel({});
  var _configModel = configModel({});
  var createModel = new AddLayerModel({}, {
    userModel: _userModel,
    configModel: _configModel,
    userActions: {},
    pollingModel: new Backbone.Model()
  });

  var importOptions = { name: 'postgresql', title: 'PostgreSQL', type: 'database' };

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
            guessingModel: guessingModel
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
