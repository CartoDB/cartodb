var Backbone = require('backbone');
var ImportsView = require('builder/components/modals/add-layer/content/imports/imports-view');
var AddLayerModel = require('builder/components/modals/add-layer/add-layer-model');
var userModel = require('fixtures/builder/user-model.fixture');
var configModel = require('fixtures/builder/config-model.fixture');

describe('components/modals/add-layer/content/imports/imports-view', function () {
  var privacyModel = new Backbone.Model();
  var guessingModel = new Backbone.Model();
  var _userModel = userModel({
    mailchimp: {
      enabled: true
    }
  });
  var _configModel = configModel({
    oauth_gdrive: true
  });
  var createModel = new AddLayerModel({}, {
    userModel: _userModel,
    configModel: _configModel,
    userActions: {},
    pollingModel: new Backbone.Model()
  });

  beforeEach(function () {
    this.view = new ImportsView({
      userModel: _userModel,
      configModel: _configModel,
      createModel: createModel,
      privacyModel: privacyModel,
      guessingModel: guessingModel
    });

    spyOn(this.view, '_setUploadModel');
    this.view.render();
  });

  it('should call _setUploadModel on change events', function () {
    // Switch tabs back and forth, this used to break because backbone drops events
    this.view.$('.js-gdriveTab').click();
    this.view.$('.js-fileTab').click();
    var selectedTab = this.view._tabPaneCollection.filter(function (e) {
      return e.get('selected') === true;
    })[0];

    selectedTab.attributes.createContentView().trigger('change');
    expect(this.view._setUploadModel).toHaveBeenCalled();
    this.view.clean();
  });

  afterEach(function () {
    // Remove dropzone leaftover elements
    document.querySelector('input.dz-hidden-input').remove();
  });
});
