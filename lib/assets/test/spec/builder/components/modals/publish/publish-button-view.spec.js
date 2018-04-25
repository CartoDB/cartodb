var _ = require('underscore');
var Backbone = require('backbone');
var PublishButtonView = require('builder/components/modals/publish/publish-button-view');
var ConfigModel = require('builder/data/config-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');

describe('components/modals/publish/publish-button-view', function () {
  var view, visDefinitionModel, mapcapsCollection;

  var createViewFn = function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    visDefinitionModel = new VisDefinitionModel(
      {
        name: 'Foo Map',
        privacy: 'PUBLIC',
        updated_at: '2016-06-21T15:30:06+00:00',
        type: 'derived',
        permission: {}
      },
      { configModel: configModel });

    mapcapsCollection = new Backbone.Collection();

    var view = new PublishButtonView({
      visDefinitionModel: visDefinitionModel,
      mapcapsCollection: mapcapsCollection,
      configModel: configModel
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
    view.render();
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    var publishButton = view.$('.js-button');
    expect(publishButton.text()).toContain('components.modals.publish.publish-btn');
    expect(view.$el.text()).toContain('components.modals.publish.share.unpublished');
  });

  describe('_onUpdate', function () {
    it('should show PrivacyWarning modal when the visualization is published and it is going to be publicly available', function () {
      spyOn(view, '_shouldShowPrivacyWarning').and.returnValue(true);
      spyOn(view, '_createMapCap');
      spyOn(view, '_checkPrivacyChange').and.callFake(
        function (success) { success(); }
      );

      visDefinitionModel.set('privacy', 'PUBLIC', { silent: true });
      view._onUpdate();

      expect(view._checkPrivacyChange).toHaveBeenCalled();
      expect(view._createMapCap).toHaveBeenCalled();
    });

    it('should not warn about privacy if visualization it not is going to be publicly available', function () {
      spyOn(view, '_shouldShowPrivacyWarning').and.returnValue(false);
      spyOn(view, '_checkPrivacyChange');
      spyOn(view, '_createMapCap');

      visDefinitionModel.set('privacy', 'PRIVATE', { silent: true });
      view._onUpdate();

      expect(view._createMapCap).toHaveBeenCalled();
      expect(view._checkPrivacyChange).not.toHaveBeenCalled();
    });
  });

  describe('_checkPrivacyChange', function () {
    it('should open PrivacyWarningView', function (done) {
      view._checkPrivacyChange();

      var dialogView = document.querySelector('.Dialog');
      expect(dialogView.innerText).toContain('components.modals.privacy-warning.title');

      view.clean();

      // Wait for the modal to close
      setTimeout(function () { done(); }, 250);
    });
  });

  describe('_shouldShowPrivacyWarning', function () {
    it('should return true if map is not published and privacy is set to *any* public state', function () {
      visDefinitionModel.set('privacy', 'LINK');

      expect(view._shouldShowPrivacyWarning()).toBe(true);
    });

    it('should return false if map is published', function () {
      mapcapsCollection.add({
        created_at: '2016-06-21T15:30:06+00:00'
      });

      expect(view._shouldShowPrivacyWarning()).toBe(false);

      mapcapsCollection.reset([]);
    });

    it('should return false if map is published and privacy is set to private', function () {
      visDefinitionModel.set('privacy', 'PRIVATE');
      mapcapsCollection.add({ created_at: '2016-06-21T15:30:06+00:00' });

      expect(view._shouldShowPrivacyWarning()).toBe(false);

      mapcapsCollection.reset([]);
    });
  });
});
