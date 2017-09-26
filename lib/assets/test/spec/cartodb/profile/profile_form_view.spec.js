var cdb = require('cartodb.js-v3');
var ProfileFormView = require('../../../../javascripts/cartodb/profile/profile_form_view');

describe('profile/profile_form_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'e00000002@d00000002.com',
      account_type: 'FREE'
    });
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    this.setLoadingSpy = jasmine.createSpy('setLoading');
    this.showSuccessSpy = jasmine.createSpy('showSuccess');
    this.showErrorsSpy = jasmine.createSpy('showErrors');

    this.model = new cdb.core.Model();

    this.view = new ProfileFormView({
      user: this.user,
      setLoading: this.setLoadingSpy,
      onSaved: this.showSuccessSpy,
      onError: this.showErrorsSpy,
      renderModel: this.model
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
