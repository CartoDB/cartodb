var BasemapCategoriesView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-categories-view');
var CarouselCollection = require('../../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-collection');

describe('editor/layers/basemap-content-views/basemap-categories-view', function () {
  beforeEach(function () {
    this.collection = new CarouselCollection([{
      selected: true,
      val: 'CARTO',
      label: 'CARTO',
      template: function () {
        return 'CARTO';
      }
    }, {
      selected: false,
      val: 'Here',
      label: 'Here',
      template: function () {
        return 'Here';
      }
    }, {
      selected: false,
      val: 'Stamen',
      label: 'Stamen',
      template: function () {
        return 'Stamen';
      }
    }, {
      selected: false,
      val: 'Custom',
      label: 'Custom',
      template: function () {
        return 'Custom';
      }
    }, {
      selected: false,
      val: 'Color',
      label: 'Color',
      template: function () {
        return 'Color';
      }
    }, {
      selected: false,
      val: 'Mapbox',
      label: 'Mapbox',
      template: function () {
        return 'Mapbox';
      }
    }]);

    this.view = new BasemapCategoriesView({
      categoriesCollection: this.collection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.Carousel-item').length).toBe(6);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
