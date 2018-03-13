const Backbone = require('backbone');
const ServiceItemView = require('dashboard/components/service-item/service-item-view');
const ServiceValidToken = require('dashboard/data/service-valid-token-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/components/service-item/service-item-view', function () {
  let view;

  const createViewFn = function () {
    const view = new ServiceItemView({
      model: new Backbone.Model({
        name: 'dropbox',
        title: 'Dropbox',
        state: 'idle',
        revoke_url: '',
        connected: true
      }),
      configModel: ConfigModelFixture
    });

    return view;
  };

  beforeEach(function () {
    spyOn(ServiceValidToken.prototype, 'fetch').and.callFake(function (options) {
      options.success(null, {
        oauth_valid: true
      });
    });

    spyOn(ServiceItemView.prototype, '_checkToken');

    view = createViewFn();
    spyOn(view, '_reloadWindow');

    view.render();
  });

  afterEach(function () {
    view.clean();
  });

  it('should check token if it is connected from the beginning', function () {
    expect(view._checkToken).toHaveBeenCalled();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(view.$('.FormAccount-input').length).toBe(1);
      expect(view.$('.FormAccount-input').val().toLowerCase()).toBe('connected');
      expect(view.$('.FormAccount-input').hasClass('is-disabled')).toBeTruthy();
      expect(view.$('.js-disconnect').length).toBe(1);
      expect(view.$('.js-disconnect').text().toLowerCase()).toBe('disconnect');
    });

    it('should render when connected is changed', function () {
      view.model.set('connected', false);
      expect(view.$('.FormAccount-input').length).toBe(0);
      expect(view.$('.js-disconnect').length).toBe(0);
      expect(view.$('.js-connect').length).toBe(1);
      expect(view.$('.js-connect').text().toLowerCase()).toContain('connect');
      expect(view.$('.js-connect .ServiceIcon').length).toBe(1);
    });

    it('should render when status is changed', function () {
      view.model.set('state', 'loading');
      expect(view.$('.js-disconnect').length).toBe(0);
      expect(view.$('.FormAccount-rowInfoText').text().toLowerCase()).toContain('disconnecting...');
      view.model.set('connected', false);
      expect(view.$('.js-connect').length).toBe(0);
      expect(view.$('.FormAccount-link').text().toLowerCase()).toContain('connecting...');
    });

    it('should show an error when something is wrong', function () {
      view.model.set('state', 'error');
      expect(view.$('.FormAccount-rowInfoText--error').length).toBe(1);
      expect(view.$('.FormAccount-rowInfoText--error .FormAccount-link').length).toBe(2);
      expect(view.$('.FormAccount-rowInfoText--error .js-disconnect').length).toBe(1);
      view.model.set('connected', false);
      expect(view.$('.js-connect').length).toBe(1);
    });
  });

  it('should not have leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
