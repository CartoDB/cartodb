const FooterView = require('dashboard/components/footer/footer-view');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/components/footer/footer-view', function () {
  let view;

  const createViewFn = function () {
    const view = new FooterView({
      configModel: ConfigModelFixture
    });
    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/help/">Help</a></li>');
      expect(view.$el.html()).not.toContain('Version:');
      expect(view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:support@carto.com">Support</a></li>');
    });
  });

  describe('is hosted', function () {
    it('should render properly', function () {
      ConfigModelFixture.set('cartodb_com_hosted', true);

      view.render();

      expect(view.$el.html()).not.toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/help/">Help</a></li>');
    });
  });

  describe('onpremises', function () {
    it('should render properly', function () {
      ConfigModelFixture.set('onpremise_version', '1.0.0');

      view.render();

      expect(view.$el.html()).toContain('Version: 1.0.0');
      expect(view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:onpremise-support@carto.com">Support</a></li>');
    });
  });

  it('should not have leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
