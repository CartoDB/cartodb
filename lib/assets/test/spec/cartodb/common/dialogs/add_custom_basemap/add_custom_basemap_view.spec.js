var AddCustomBasemapView = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/add_custom_basemap_view.js');

describe('common/dialog/add_custom_basemap/add_custom_basemap_view', function() {
  beforeEach(function() {
    this.view = new AddCustomBasemapView();
    this.view.render();
  });

  it('should render the tabs', function() {
    expect(this.innerHTML()).toContain('XYZ');
  });

  it('should start on XYZ view', function() {
    expect(this.innerHTML()).toContain('Insert your XYZ URL');
    expect(this.innerHTML()).toContain('js-xyz is-selected');
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
