var InfowindowFormView = require('builder/editor/layers/layer-content-views/infowindow/infowindow-form-view.js');
var InfowindowDefinitionModel = require('builder/data/infowindow-definition-model');
var ConfigModel = require('builder/data/config-model');

describe('editor/layers/layer-content-view/infowindows/infowindow-form-view', function () {
  var view, model;

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    model = new InfowindowDefinitionModel({
      template_name: '',
      width: 400
    }, {
      configModel: this.configModel
    });

    view = new InfowindowFormView({
      model: model
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      view.render();
      expect(view.$('form').length).toBe(1);
    });
  });

  it('should update fields depending on template_name', function () {
    view.model.set('template_name', 'test1');
    view.render();
    expect(view.$('.Editor-formInner').length).toBe(1);
    expect(view.$('.Editor-formInner label').text().trim()).toEqual('editor.layers.infowindow.style.size.label');

    view.model.set('template_name', 'infowindow_color');
    view.render();
    expect(view.$('.Editor-formInner').length).toBe(2);
    expect(view.$('.Editor-formInner:eq(1) label').text().trim()).toEqual('editor.layers.infowindow.style.header-color');
  });

  it('should update width', function () {
    view.model.set('template_name', 'test1');
    view.render();
    expect(view.$('.Editor-formInner .js-input').val()).toBe('400');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});
