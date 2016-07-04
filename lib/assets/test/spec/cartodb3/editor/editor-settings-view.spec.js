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

    view = new EditorSettingsView({
      overlaysCollection: new Backbone.Collection(),
      editorModel: new Backbone.Model(),
      mapDefinitionModel: new Backbone.Model(),
      settingsCollection: collection
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

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
