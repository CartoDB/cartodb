var Backbone = require('backbone');
var _ = require('underscore');
var AssetsView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/assets-view');

describe('components/form-components/editors/fill/input-color/assets-view', function () {
  beforeEach(function () {
    this.view = new AssetsView({
      model: new Backbone.Model({}),
      modalModel: {},
      configModel: {},
      userModel: {}
    });
    this.view.render();
  });

  it('should render tabs', function () {
    expect(this.view.$el.text()).toBeDefined();
    expect(this.view.$el.text()).toContain('components.modals.add-asset.maki-icons');
    expect(this.view.$el.text()).toContain('components.modals.add-asset.simple-icons');
    expect(this.view.$el.text()).toContain('components.modals.add-asset.pin-icons');
    expect(this.view.$el.text()).toContain('components.modals.add-asset.your-uploads');
    expect(this.view.$el.text()).toContain('components.modals.add-asset.upload-file');
  });

  it('should render upload button', function () {
    expect(this.view.$('.js-add').length).toBe(1);
  });

  it('should render disclaimer', function () {
    expect(this.view.$el.text()).toContain('Maki Icons, an open source project by Mapbox');
  });
});
