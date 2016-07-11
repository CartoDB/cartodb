var BreadcrumbsDropdownView = require('../../../../../../../javascripts/cartodb/common/views/dashboard_header/breadcrumbs/dropdown_view');
var Router = require('../../../../../../../javascripts/cartodb/dashboard/router');
var cdbAdmin = require('cdb.admin');
var HeaderViewModel = require('../../../../../../../javascripts/cartodb/dashboard/header_view_model')

describe('common/views/dashboard_header/breadcrumbs/dropdown_view', function() {
  beforeEach(function() {
    var godModel = window.cdb.god;
    this.user = new cdbAdmin.User({
      base_url: 'http://pepe.carto.com',
      username: 'pepe'
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });
    this.headerViewModel = new HeaderViewModel(this.router);
    spyOn(this.router, 'navigate');
    spyOn(this.router.model, 'get');
    this.router.model.get.and.returnValue('maps');

    this.view = new BreadcrumbsDropdownView({
      router: this.router,
      viewModel: this.headerViewModel,
      model: this.user,
      template_base: 'common/views/dashboard_header/breadcrumbs/dropdown'
    });

    spyOn(this.view, 'hide');
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered a URL for maps', function() {
      expect(this.innerHTML()).toMatch('href="http://pepe.carto.com/dashboard/maps"');
  });

  it('should have rendered a URL for datasets', function() {
    expect(this.innerHTML()).toMatch('href="http://pepe.carto.com/dashboard/datasets"');
  });

  it('should have rendered a URL for locked datasets', function() {
    expect(this.innerHTML()).toMatch('href="http://pepe.carto.com/dashboard/datasets/locked"');
  });

  it('should have rendered a URL for locked maps', function() {
    expect(this.innerHTML()).toMatch('href="http://pepe.carto.com/dashboard/maps/locked"');
  });

  it('should hide when event is triggered on cdb.god model', function() {
    cdb.god.trigger('closeDialogs');
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should have one selected link at least', function() {
    expect(this.innerHTML()).toContain('is-selected');
  });

  describe('click on any link', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
    });

    describe('given a normal click', function() {
      beforeEach(function() {
        this.view.$('a').click();
        this.args = this.router.navigate.calls.argsFor(0);
      });

      it('should cancel default link behaviour', function() {
        expect(this.view.killEvent).toHaveBeenCalled();
      });

      it('should call navigate on the route with the href value', function() {
        expect(this.args[0]).toMatch('http://pepe.carto.com/dashboard/maps');
      });

      it('should tell router to trigger a change event', function() {
        expect(this.args[1]).toEqual({ trigger: true });
      });

      it('should close the dialog', function() {
        expect(this.view.hide).toHaveBeenCalled();
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
