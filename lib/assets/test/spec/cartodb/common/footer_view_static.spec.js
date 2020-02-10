var cdb = require('cartodb.js-v3');
var FooterView = require('../../../../javascripts/cartodb/common/footer_view_static');

describe('common/footer_view_static', function () {
  beforeEach(function () {
    this.view = new FooterView();
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/help/">Help</a></li>');
      expect(this.view.$el.html()).not.toContain('Version:');
      expect(this.view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:support@carto.com">Support</a></li>');
    });
  });

  describe('is hosted', function () {
    it('should render properly', function () {
      cdb.config.set('cartodb_com_hosted', true);

      this.view.render();

      expect(this.view.$el.html()).not.toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="https://carto.com/help/">Help</a></li>');
    });
  });

  describe('onpremises', function () {
    it('should render properly', function () {
      cdb.config.set('onpremise_version', '1.0.0');

      this.view.render();

      expect(this.view.$el.html()).toContain('Version: 1.0.0');
      expect(this.view.$el.html()).toContain('<li class="Footer-listItem CDB-Text CDB-Size-medium"><a href="mailto:onpremise-support@carto.com">Support</a></li>');
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
