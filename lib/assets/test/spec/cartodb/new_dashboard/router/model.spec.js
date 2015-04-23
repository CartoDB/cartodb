var RouterModel = require('../../../../../javascripts/cartodb/new_dashboard/router/model');

describe("new_dashboard/router/model", function() {
  beforeEach(function() {
    var dashboardUrl = new cdb.common.DashboardUrl({
      base_url: 'http://pepe.cartodb.com/dashboard'
    });

    this.model = new RouterModel({
      shared: false,
      page: 1
    }, {
      dashboardUrl: dashboardUrl
    });
  });

  describe('.urlForCurrentContentType', function() {
    it('should return a URL to the current content type', function() {
      expect(this.model.urlForCurrentContentType().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');

      this.model.set('content_type', 'maps');
      expect(this.model.urlForCurrentContentType().toString()).toEqual('http://pepe.cartodb.com/dashboard/maps');
    });
  });

  describe('.urlForCurrentState', function() {
    describe('given no args', function() {
      it('should return the URL with page 1 ommitted', function() {
        expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });

      describe('and default state', function() {
        it("should return the URL to the contents without any filters", function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });

      describe('and router have shared contents', function() {
        beforeEach(function() {
          this.model.set('shared', 'only');
        });

        it('should return the URL to the shared contents', function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared');
        });
      });

      describe('and router have no shared but liked contents', function() {
        beforeEach(function() {
          this.model.set({
            shared: 'no',
            liked:  true
          });
        });

        it("should return the URL to liked conents", function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/liked');
        });
      });

      describe('and router have shared and locked contents', function() {
        beforeEach(function() {
          this.model.set({
            shared: 'only',
            locked: true
          });
        });

        it('should return the URL to the shared and locked contents', function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared/locked');
        });

        it('should return the URL to the shared and locked contents', function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared/locked');
        });
      });

      describe('and router have library content', function() {
        beforeEach(function() {
          this.model.set({
            library: true
          });
        });

        it('should return the URL to library content', function() {
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/library');
        });
      });

      describe('and page is set', function() {
        it('should return the URL with page set', function() {
          this.model.set({ page: 42 });
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/42');
        });

        it('should return the URL with page ommitted if set to 1', function() {
          this.model.set({ page: 1 });
          expect(this.model.urlForCurrentState().toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });
    });

    describe('given a search tag', function() {
      it('should return the URL to see contents tagged with the given tag', function() {
        expect(this.model.urlForCurrentState({ search: ':foobar' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/tag/foobar');
      });

      it('should URL encode the search string', function() {
        expect(this.model.urlForCurrentState({ search: ':foobar baz' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/tag/foobar%20baz');
      });
    });

    describe('given a search string', function() {
      it('should return the URL to see contents w/ name or desc of search string', function() {
        expect(this.model.urlForCurrentState({ search: 'baz' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/search/baz');
      });

      it('should URL encode the search string', function() {
        expect(this.model.urlForCurrentState({ search: 'baz baz' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/search/baz%20baz');
      });
    });

    describe('given an empty search str', function() {
      beforeEach(function() {
        this.model.set('q', 'prev');
        this.model.set('tag', 'tag');
      });

      it('should return a URL w/o search or tag', function() {
        expect(this.model.urlForCurrentState({ search: '' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });
    });

    describe('given a page param', function() {
      describe('and the page is set to 1', function() {
        it('should return a URL with the page ommitted', function() {
          expect(this.model.urlForCurrentState({ page: 1 }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        });
      });

      describe('and the page is set to something larger than 1', function() {
        it('should return a URL with the page set', function() {
          expect(this.model.urlForCurrentState({ page: 42 }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/42');
        });
      });
    });

    describe('given a locked param', function() {
      it('should return a URL with the locked set to the value of locked', function() {
        expect(this.model.urlForCurrentState({ locked: true }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/locked');
        expect(this.model.urlForCurrentState({ locked: false }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });
    });

    describe('given a shared param', function() {
      it('should return a URL without the shared param', function() {
        this.model.set('shared', 'yes');
        expect(this.model.urlForCurrentState({ shared: 'no' }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
      });
    });

    describe('given a liked param', function() {
      it('should return a URL without the liked param', function() {
        this.model.set('liked', true);
        expect(this.model.urlForCurrentState({ liked: false }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets');
        this.model.set('shared', 'only');
        expect(this.model.urlForCurrentState({ liked: true }).toString()).toEqual('http://pepe.cartodb.com/dashboard/datasets/shared');
      });
    });
  });

  describe('.isSearching', function() {
    it('should return true if set to a search or tag query', function() {
      this.model.set({
        q: '',
        tag: ''
      });
      expect(this.model.isSearching()).toBeFalsy();

      this.model.set({
        q: 'foobar',
        tag: ''
      });
      expect(this.model.isSearching()).toBeTruthy();

      this.model.set({
        q: '',
        tag: 'some-tag'
      });
      expect(this.model.isSearching()).toBeTruthy();
    });
  });
});
