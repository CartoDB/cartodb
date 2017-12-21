var MosaicView = require('../../../../../javascripts/cartodb3/components/mosaic/mosaic-view');

describe('components/mosaic/mosaic-view', function () {
  beforeEach(function () {
    this.view = new MosaicView({
      options: [
        { val: 'hello', selected: true },
        { val: 'howdy' },
        { val: 'hi' }
      ]
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('li').length).toBe(3);
  });
});
