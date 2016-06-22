var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var InfowindowDescriptionView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-description-view.js');
var InfowindowDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/infowindow-definition-model');

describe('editor/layers/layer-content-view/infowindows/infowindow-description-view', function () {
  var view, model;

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    model = new InfowindowDefinitionModel({
      fields: [
        {
          name: 'description',
          title: true,
          position: 0
        },
        {
          name: 'name',
          title: true,
          position: 1
        }
      ]
    }, {
      configModel: this.configModel
    });

    view = new InfowindowDescriptionView({
      model: model,
      namesCount: 2
    });
  });

  it('should render all selected', function () {
    view.render();
    expect(view.$('.js-textInfo').html().trim()).toEqual('All selected');
  });

  it('should render count selected', function () {
    view.model.set('fields', [{ name: 'description', title: true, position: 0 }]);
    view.render();
    expect(view.$('.js-textInfo').html().trim()).toEqual('1 selected');
  });

  it('should render none selected', function () {
    view.model.set('fields', []);
    view.render();
    expect(view.$('.js-textInfo').html().trim()).toEqual('None selected');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});

