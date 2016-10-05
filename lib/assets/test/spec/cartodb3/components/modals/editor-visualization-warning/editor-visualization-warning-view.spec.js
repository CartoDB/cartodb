var Backbone = require('backbone');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var EditorVisualizationWarningView = require('../../../../../../javascripts/cartodb3/components/modals/editor-visualization-warning/editor-visualization-warning-view');

describe('cartodb3/components/modals/editor-visualization-warning', function () {
  beforeEach(function () {
    var visDefinitionModel = new VisDefinitionModel({
      id: '1234567890',
      name: 'Foo Map',
      type: 'derived'
    }, {
      configModel: new ConfigModel({
        base_url: '/u/marieta'
      })
    });

    var modalModel = new Backbone.Model();

    this.view = new EditorVisualizationWarningView({
      modalModel: modalModel,
      visDefinitionModel: visDefinitionModel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render template', function () {
    expect(this.view.$el.html()).toContain('Modal-inner');
  });

  describe('_onOpen', function () {
    it('should call _onOpen when .js-open is clicked', function () {
      spyOn(this.view._modalModel, 'destroy');
      this.view.$('.js-open').click();
      expect(this.view._modalModel.destroy).toHaveBeenCalled();
    });
  });

  describe('_onDuplicate', function () {
    it('should call _onDuplicate when .js-duplicate is clicked', function () {
      spyOn(this.view, '_renderLoading').and.callFake(function () {
        return true;
      });
      this.view.$('.js-duplicate').click();
      expect(this.view._renderLoading).toHaveBeenCalled();
    });
  });

  describe('_onCancel', function () {
    it('should call _onCancel when .js-cancel is clicked', function () {
      spyOn(this.view, '_goToDashboard').and.callFake(function () {
        return true;
      });
      this.view.$('.js-cancel').click();
      expect(this.view._goToDashboard).toHaveBeenCalled();
    });
  });
});
