const UserQuotaSliderView = require('dashboard/views/organization/organization-user-quota-slider');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

describe('organization/organization-user-quota-slider', function () {
  let view, userModel;

  function createViewFn () {
    this.elHTML = '<div class="js-userQuotaSlider"></div>';

    userModel = new UserModelFixture();

    spyOn(UserQuotaSliderView.prototype, '_onQuotaChange');

    return new UserQuotaSliderView({
      el: this.elHTML,
      model: userModel
    });
  }
  beforeEach(function () {
    view = createViewFn();
    view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();
      expect(view.$el.hasClass('js-userQuotaSlider')).toBeTruthy();
    });

    it('should not have leaks', function () {
      expect(view).toHaveNoLeaks();
    });
  });

  describe('.initBinds', function () {
    it('calls _onQuotaChange when userModel quota_in_bytes changes', function () {
      userModel.set('quota_in_bytes', 1337);
      expect(view._onQuotaChange).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    view.clean();
  });
});
