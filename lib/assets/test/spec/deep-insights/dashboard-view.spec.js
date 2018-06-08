var Backbone = require('backbone');
var DashboardView = require('../../../javascripts/deep-insights/dashboard-view');
var cdb = require('internal-carto.js');

describe('dashboard-view', function () {
  beforeEach(function () {
    this.view = new DashboardView({
      widgets: new Backbone.Collection(),
      model: new cdb.core.Model({
        renderMenu: true
      })
    });
  });

  it('should setup the template initially because it is required for vis to work', function () {
    expect(this.view.$el.html()).toContain('id="map"');
  });

  describe('when render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should create widgets subviews ', function () {
      expect(this.view.el.querySelector('.Widget-canvas')).toBeDefined();
      expect(this.view.el.querySelector('.Dashboard-belowMap')).toBeDefined();
    });
  });

  describe('CARTO logo', function () {
    beforeEach(function () {
      this.view.model = new Backbone.Model({
        renderMenu: true,
        showLogo: true
      });
      this.view.render();
    });

    it('should render logo properly', function () {
      expect(this.view.el.querySelectorAll('.CDB-Dashboard-menuLogo').length).toBe(2); // sidebar and mobile footer

      this.view.model.set('renderMenu', false);
      this.view.render();
      expect(this.view.el.querySelectorAll('.CDB-Dashboard-menuLogo').length).toBe(0);

      this.view.model.set({
        renderMenu: true,
        showLogo: false
      });
      this.view.render();
      expect(this.view.el.querySelectorAll('.CDB-Dashboard-menuLogo').length).toBe(0);
    });
  });
});
