var RouterModel = require('../../../../../javascripts/cartodb/new_dashboard/router/model');

describe("new_dashboard/router/model", function() {
  beforeEach(function() {
    var dashboardUrl = new cdb.common.DashboardUrl({
      base_url: 'http://pepe.cartodb.com/dashboard'
    });

    this.model = new RouterModel({
      dashboardUrl: dashboardUrl,
      content_type: 'datasets',
      shared: false,
      page: 1
    });
  });

  describe('.url', function() {
    describe('given no args', function() {
      it('should return the URL with page 1 ommitted', function() {
        expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });

      describe('and default state', function() {
        it("should return the URL to the contents without any filters", function() {
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });

      describe('and router have shared contents', function() {
        beforeEach(function() {
          this.model.set('shared', true);
        });

        it('should return the URL to the shared contents', function() {
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared');
        });
      });

      describe('and router have no shared but liked contents', function() {
        beforeEach(function() {
          this.model.set({
            shared: false,
            liked:  true
          });
        });

        it("should return the URL to liked conents", function() {
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets/liked');
        });
      });

      describe('and router have shared and locked contents', function() {
        beforeEach(function() {
          this.model.set({
            shared: true,
            locked: true
          });
        });

        it('should return the URL to the shared and locked contents', function() {
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared/locked');
        });
      });

      describe('and router have library content', function() {
        beforeEach(function() {
          this.model.set({
            library: true
          });
        });

        it('should return the URL to library content', function() {
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets/library');
        });
      });

      describe('and page is set', function() {
        it('should return the URL with page set', function() {
          this.model.set({ page: 42 });
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets/42');
        });

        it('should return the URL with page ommitted if set to 1', function() {
          this.model.set({ page: 1 });
          expect(this.model.url()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });
    });

    describe('given a search tag', function() {
      it('should return the URL to see contents tagged with the given tag', function() {
        expect(this.model.url({ search: ':foobar' })).toEqual('http://pepe.cartodb.com/dashboard/datasets/tag/foobar');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: ':foobar baz' })).toEqual('http://pepe.cartodb.com/dashboard/datasets/tag/foobar%20baz');
      });
    });

    describe('given a search string', function() {
      it('should return the URL to see contents w/ name or desc of search string', function() {
        expect(this.model.url({ search: 'baz' })).toEqual('http://pepe.cartodb.com/dashboard/datasets/search/baz');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: 'baz baz' })).toEqual('http://pepe.cartodb.com/dashboard/datasets/search/baz%20baz');
      });
    });

    describe('given an empty search str', function() {
      beforeEach(function() {
        this.model.set('q', 'prev');
        this.model.set('tag', 'tag');
      });

      it('should return a URL w/o search or tag', function() {
        expect(this.model.url({ search: '' })).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });
    });

    describe('given a page param', function() {
      describe('and the page is set to 1', function() {
        it('should return a URL with the page ommitted', function() {
          expect(this.model.url({ page: 1 })).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });

      describe('and the page is set to something larger than 1', function() {
        it('should return a URL with the page set', function() {
          expect(this.model.url({ page: 42 })).toEqual('http://pepe.cartodb.com/dashboard/datasets/42');
        });
      });
    });

    describe('given a locked param', function() {
      it('should return a URL with the locked set to the value of locked', function() {
        expect(this.model.url({ locked: true })).toEqual('http://pepe.cartodb.com/dashboard/datasets/locked');
        expect(this.model.url({ locked: false })).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });
    });
  });
});
