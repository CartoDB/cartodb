const UserQuotaSliderInputView = require('dashboard/views/organization/organization-user-quota-slider-input');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

describe('organization/organization-user-quota-slider-input', function () {
  let view, userModel;

  function createViewFn () {
    this.elHTML = '<div class="js-userQuotaSliderInput"></div>';

    userModel = new UserModelFixture();

    spyOn(UserQuotaSliderInputView.prototype, '_onQuotaChange');

    return new UserQuotaSliderInputView({
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
      expect(view.$el.hasClass('js-userQuotaSliderInput')).toBeTruthy();
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
