var Backbone = require('backbone');
var EditorSettingsView = require('../../../../javascripts/cartodb3/editor/editor-settings-view');

describe('editor/editor-settings-view', function () {
  var view;
  var collection;

  beforeEach(function () {
    collection = new Backbone.Collection([{
      setting: 'title',
      label: _t('editor.settings.options.title'),
      enabled: true,
      default: false
    }, {
      setting: 'description',
      label: _t('editor.settings.options.description'),
      enabled: true,
      default: false
    }, {
      setting: 'search',
      label: _t('editor.settings.options.search'),
      enabled: true,
      default: false
    }, {
      setting: 'zoom',
      label: _t('editor.settings.options.zoom'),
      enabled: true,
      default: true
    }]);

    view = new EditorSettingsView({
      mapDefinitionModel: new Backbone.Model(),
      settingsCollection: collection
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.CDB-Toggle').length).toBe(4);

    collection.at(0).set({enabled: false});
    view.render();
    expect(view.$('.CDB-Toggle').length).toBe(3);
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
