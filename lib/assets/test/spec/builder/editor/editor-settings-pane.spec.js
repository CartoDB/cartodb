var Backbone = require('backbone');
var EditorSettingsPane = require('builder/editor/editor-settings-pane');
var ModalsService = require('builder/components/modals/modals-service-model');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var ConfigModel = require('builder/data/config-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var UserModel = require('builder/data/user-model');

describe('editor/editor-settings-pane', function () {
  var view;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

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

    var settingsCollection = new Backbone.Collection([{
      setting: 'title',
      label: _t('editor.settings.options.title'),
      enabled: true,
      default: false,
      enabler: false
    }, {
      setting: 'description',
      label: _t('editor.settings.options.description'),
      enabled: true,
      default: false,
      enabler: false
    }, {
      setting: 'search',
      label: _t('editor.settings.options.search'),
      enabled: true,
      default: false,
      enabler: true
    }, {
      setting: 'zoom',
      label: _t('editor.settings.options.zoom'),
      enabled: true,
      default: true,
      enabler: true
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

    var editorModel = new Backbone.Model();
    editorModel.isEditing = function () {
      return false;
    };

    var userModel = new UserModel({
      actions: {
        private_maps: true,
        private_tables: true
      }
    }, { configModel: configModel });

    var overlaysCollection = new Backbone.Collection();
    overlaysCollection.hasFetched = function () { return true; };

    view = new EditorSettingsPane({
      className: 'Editor-content',
      configModel: configModel,
      editorModel: editorModel,
      mapcapsCollection: mapcapsCollection,
      mapDefinitionModel: new Backbone.Model(),
      modals: new ModalsService(),
      overlaysCollection: overlaysCollection,
      privacyCollection: privacyCollection,
      settingsCollection: settingsCollection,
      userModel: userModel,
      visDefinitionModel: visDefinitionModel
    });
  });

  it('should be able to check if the user is the owner', function () {
    expect(view._isOwner()).toEqual(true);
  });
});
