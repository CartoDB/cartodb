var BreadcrumbsDropdownView = require('new_dashboard/header/breadcrumbs/dropdown_view');
var Backbone = require('backbone');

describe('new_dashboard/header/breadcrumbs/dropdown_view', function() {
  beforeEach(function() {
    var godModel = window.cdb.god;
    var cdb = {
      config: {
        prefixUrl: jasmine.createSpy()
      },
      god: godModel
    };
    cdb.config.prefixUrl.and.returnValue('/foobar-prefix');
    BreadcrumbsDropdownView.__set__('cdb', cdb);

    this.router = new Backbone.Model();
    this.router.navigate = jasmine.createSpy();
    this.router.model = jasmine.createSpyObj('router-model', ['get']);
    this.router.model.get.and.returnValue('maps');

    this.view = new BreadcrumbsDropdownView({
      router: this.router,
      model: new Backbone.Model(),
      template_base: 'new_dashboard/header/breadcrumbs/dropdown'
    });

    spyOn(this.view, 'hide');
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered a URL for maps', function() {
    expect(this.innerHTML()).toContain('href="/foobar-prefix/dashboard/maps"');
  });

  it('should have rendered a URL for datasets', function() {
    expect(this.innerHTML()).toContain('href="/foobar-prefix/dashboard/datasets"');
  });

  it('should have rendered a URL for locked datasets', function() {
    expect(this.innerHTML()).toContain('href="/foobar-prefix/dashboard/datasets/locked"');
  });

  it('should have rendered a URL for locked maps', function() {
    expect(this.innerHTML()).toContain('href="/foobar-prefix/dashboard/maps/locked"');
  });

  it('should hide when event is triggered on cdb.god model', function() {
    cdb.god.trigger('closeDialogs');
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should have one selected link at least', function() {
    expect(this.innerHTML()).toContain('is--selected');
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
        expect(this.args[0]).toEqual('/foobar-prefix/dashboard/maps');
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
