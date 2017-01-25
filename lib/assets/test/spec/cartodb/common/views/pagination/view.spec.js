var PaginationModel = require('../../../../../../javascripts/cartodb/common/views/pagination/model');
var PaginationView = require('../../../../../../javascripts/cartodb/common/views/pagination/view');
var Router = require('../../../../../../javascripts/cartodb/common/router.js');

describe('common/views/pagination/view', function() {
  beforeEach(function() {
    var dashboardUrl = new cdb.common.DashboardUrl({
      base_url: 'http://pepe.carto.com/dashboard/datasets'
    });

    this.model = new PaginationModel({
      total_count:  9000,
      per_page:     50,
      current_page: 42,
      url_to:       function(page) { return dashboardUrl.urlToPath(page); }
    });
    spyOn(this.model, 'bind').and.callThrough();

    this.router = new Router({
      dashboardUrl: dashboardUrl
    });
    spyOn(this.router, 'navigate');

    this.createView = function() {
      this.view = new PaginationView({
        model: this.model,
        router: this.router
      });
    };

    this.createView();
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render current page and the total count', function() {
    expect(this.innerHTML()).toContain('Page 42 of 180');
  });

  it('should render URLs by provided url_to function', function() {
    expect(this.innerHTML()).toContain('http://pepe.carto.com/dashboard/datasets/40'); //first
    expect(this.innerHTML()).toContain('http://pepe.carto.com/dashboard/datasets/44'); //last
  });

  it('should re-render on model change', function() {
    expect(this.model.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  describe('given there are no items', function() {
    beforeEach(function() {
      // Effectively tests model event listener and re-rendering too
      this.model.set({
        total_count:  0,
        current_page: 1
      });
    });

    it('should not render pagination items at all', function() {
      expect(this.innerHTML()).not.toContain('Page ');
      expect(this.innerHTML()).not.toContain('Pagination-label');
      expect(this.innerHTML()).not.toContain('Pagination-list');
    });
  });

  describe('given there is only one page', function() {
    beforeEach(function() {
      this.model.set({
        total_count:  this.model.get('per_page'),
        current_page: 1
      });
    });

    it('should not render pagination label', function() {
      expect(this.innerHTML()).not.toContain('Page 1 of 1');
    });

    it('should not render pagination list', function() {
      expect(this.innerHTML()).not.toContain('Pagination-list');
    });
  });

  describe('given current page is larger than available page', function() {
    beforeEach(function() {
      this.model.set({
        total_count: this.model.get('per_page'),
        current_page: 9000
      });
    });

    it('should not render pagination list', function() {
      expect(this.innerHTML()).not.toContain('Pagination-list');
    });
  });


  describe('click a link', function() {
    beforeEach(function() {
      this.clickLink = function() {
        this.view.$('a').click();
      };
      this.model.bind('change', function() {
        this.called = true;
      }, this);
    });

    describe('when view is created with a router', function() {
      beforeEach(function() {
        this.clickLink();
      });

      it('should navigate through router', function() {
        expect(this.router.navigate).toHaveBeenCalled();
      });

      it('should update the current page', function() {
        expect(this.called).toBeTruthy();
      });
    });

    describe('when view is not created with a router', function() {
      beforeEach(function() {
        this.router = undefined;
        this.createView();
        this.view.render();
        this.clickLink();
      });

      it('should update the current page', function() {
        expect(this.called).toBeTruthy();
      });

      describe("when model doesn't have any url method", function() {
        beforeEach(function() {
          this.model.set('url_to', undefined);
          spyOn(this.view, 'killEvent').and.callThrough();
          spyOn(this.model, 'set');
          this.view.$('a').click();
        });

        it('should prevent default click behaviour', function() {
          expect(this.view.killEvent).toHaveBeenCalled();
          expect(this.model.set).toHaveBeenCalled();
        });

        it('should update the model with new current page', function() {
          expect(this.model.set).toHaveBeenCalled();
          expect(this.model.set).toHaveBeenCalledWith('current_page', jasmine.any(Number));
        });
      });
    });
  });


  afterEach(function() {
    this.view.clean();
  });
});
