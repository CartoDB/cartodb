var Backbone = require('backbone');
var EditorSettingsView = require('../../../../javascripts/cartodb3/editor/editor-settings-view');
var ModalsService = require('../../../../javascripts/cartodb3/components/modals/modals-service-model');
var PrivacyCollection = require('../../../../javascripts/cartodb3/components/modals/publish/privacy-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('editor/editor-settings-view', function () {
  var view;
  var overlaysCollection;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var collection = new Backbone.Collection([{
      setting: 'title',
      label: _t('editor.settings.options.title'),
      enabled: true,
      default: false,
      active: false
    }, {
      setting: 'description',
      label: _t('editor.settings.options.description'),
      enabled: true,
      default: false,
      active: false
    }, {
      setting: 'search',
      label: _t('editor.settings.options.search'),
      enabled: true,
      default: false,
      active: true
    }, {
      setting: 'zoom',
      label: _t('editor.settings.options.zoom'),
      enabled: true,
      default: true,
      active: true
    }]);

    var privacyCollection = new PrivacyCollection([{
      privacy: 'PUBLIC',
      title: 'Public',
      desc: 'Lorem ipsum',
      cssClass: 'is-green',
      selected: true
    }, {
      privacy: 'LINK',
      title: 'Link',
      desc: 'Yabadababa',
      cssClass: 'is-orange'
    }, {
      privacy: 'PASSWORD',
      title: 'Password',
      desc: 'Wadus'
    }, {
      privacy: 'PRIVATE',
      title: 'Private',
      desc: 'Funínculo',
      cssClass: 'is-red'
    }]);

    var mapcapsCollection = new Backbone.Collection([{
      created_at: '2016-06-21T15:30:06+00:00'
    }]);

    var visDefinitionModel = new VisDefinitionModel({
      name: 'My super fun vis',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived',
      permission: {}
    }, {
      configModel: configModel
    });

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, { configModel: configModel });

    var editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return false;
    };

    overlaysCollection = new Backbone.Collection();
    overlaysCollection.hasFetched = function () { return true; };

    view = new EditorSettingsView({
      modals: new ModalsService(),
      privacyCollection: privacyCollection,
      mapcapsCollection: mapcapsCollection,
      overlaysCollection: overlaysCollection,
      editorModel: editorModel,
      mapDefinitionModel: new Backbone.Model(),
      visDefinitionModel: visDefinitionModel,
      settingsCollection: collection,
      configModel: configModel,
      userModel: userModel
    });

    view.render();
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    expect(view.$('.CDB-Checkbox').length).toBe(4);
    expect(view.$('.CDB-Checkbox:checked').length).toBe(2);
  });

  it('should render loading properly', function () {
    spyOn(overlaysCollection, 'hasFetched').and.returnValue(false);
    view.render();

    expect(view.$('.FormPlaceholder-paragraph').length).toBe(1);
    expect(view.$('.FormPlaceholder-step').length).toBe(1);
    expect(view.$('.FormPlaceholder-inner').length).toBe(1);
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
