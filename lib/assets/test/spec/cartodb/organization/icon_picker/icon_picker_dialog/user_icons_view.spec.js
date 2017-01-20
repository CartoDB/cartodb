var UserIconsView = require('../../../../../../javascripts/cartodb/organization/icon_picker/icon_picker_dialog/user_icons_view');

describe('organization/icon_picker/icon_picker_dialog/user_icons_view', function () {
  beforeEach(function () {
    this.view = new UserIconsView({
      orgId: '5p3c724-1ndv572135'
    });

    this.view.render();
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-dialogIconPicker').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(1); // iconPicker
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
