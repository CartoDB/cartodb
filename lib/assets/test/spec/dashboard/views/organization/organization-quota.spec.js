const UserQuotaView = require('dashboard/views/organization/organization-user-quota');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

describe('organization/organization-user-quota', function () {
  let view, userModel, quotaSpy;

  function createViewFn () {
    this.elHTML = `
      <div class="OrganizationUser-quota js-userQuota">
        <input type="text" id="user_quota" value="104857600">
      </div>
    `;

    userModel = new UserModelFixture();

    quotaSpy = spyOn(UserQuotaView.prototype, '_onQuotaChange');

    return new UserQuotaView({
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
      expect(view.$el.hasClass('js-userQuota')).toBeTruthy();
    });

    it('should render the new quota in bytes in the hidden input element', function () {
      quotaSpy.and.callThrough();
      userModel.set('quota_in_bytes', 157286400);
      expect(view.$el.find('#user_quota').val()).toEqual('157286400');
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
