var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var BasemapSourceView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-source-view');
var CarouselCollection = require('../../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-collection');

describe('editor/layers/basemap-content-views/basemap-source-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename'
    }, {
      configModel: {}
    });

    this.collection = new CarouselCollection([{
      selected: true,
      val: 'CartoDB',
      label: 'CartoDB',
      template: function () {
        return 'CartoDB';
      }
    }, {
      selected: false,
      val: 'Stamen',
      label: 'Stamen',
      template: function () {
        return 'Stamen';
      }
    }]);

    this.view = new BasemapSourceView({
      sourcesCollection: this.collection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.Carousel-item').length).toBe(2);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
