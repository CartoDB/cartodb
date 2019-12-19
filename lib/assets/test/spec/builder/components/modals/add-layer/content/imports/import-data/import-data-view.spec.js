const Backbone = require('backbone');
const ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
const AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
const userModel = require('fixtures/builder/user-model.fixture');
const configModel = require('fixtures/builder/config-model.fixture');

describe('components/modals/add-layer/content/imports/import-data/import-data-view', function () {
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

  beforeEach(function () {
    this.view = new ImportDataView({
      userModel: _userModel,
      configModel: _configModel,
      createModel: createModel,
      privacyModel: privacyModel,
      guessingModel: guessingModel,
      type: 'url',
      fileEnabled: true,
      acceptSync: true
    });

    spyOn(this.view, '_setUploadModel');
  });

  it('should render correctly', function () {
    this.view.render();
    expect(this.view.$el.hasClass('ImportDataPanel')).toBe(true);
    expect(this.view.$('input').length).toBe(2);
  });
});
