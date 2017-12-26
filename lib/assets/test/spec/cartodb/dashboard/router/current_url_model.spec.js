var CurrentUrlModel = require('../../../../../javascripts/cartodb/dashboard/router/current_url_model');
var VisFetchModel = require('../../../../../javascripts/cartodb/common/visualizations_fetch_model');

describe('dashboard/router/current_url_model', function() {
  beforeEach(function() {
    var dashboardUrl = new cdb.common.DashboardUrl({
      base_url: 'http://pepe.carto.com/dashboard'
    });

    this.visFetchModel = new VisFetchModel({
      shared: false,
      page: 1
    });

    this.model = new CurrentUrlModel({
      dashboardUrl: dashboardUrl,
      visFetchModel: this.visFetchModel
    });
  });

  describe('.forCurrentContentType', function() {
    it('should return a URL to the current content type', function() {
      expect(this.model.forCurrentContentType().toString()).toEqual('http://pepe.carto.com/dashboard/datasets');

      this.visFetchModel.set('content_type', 'maps');
      expect(this.model.forCurrentContentType().toString()).toEqual('http://pepe.carto.com/dashboard/maps');
    });

    it('should return deep-insights URL if it is enabled', function() {
      this.visFetchModel.set('content_type', 'maps');
      expect(this.model.forCurrentContentType().toString()).toEqual('http://pepe.carto.com/dashboard/maps');
      this.visFetchModel.set('deepInsights', true);
      expect(this.model.forCurrentContentType().toString()).toEqual('http://pepe.carto.com/dashboard/deep-insights');
      this.visFetchModel.set('content_type', 'datasets');
      expect(this.model.forCurrentContentType().toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
    });
  });

  describe('.forCurrentState', function() {
    describe('given no args', function() {
      it('should return the URL with page 1 ommitted', function() {
        expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
      });

      describe('and default state', function() {
        it('should return the URL to the contents without any filters', function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
        });
      });

      describe('and router have shared contents', function() {
        beforeEach(function() {
          this.visFetchModel.set('shared', 'only');
        });

        it('should return the URL to the shared contents', function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/shared');
        });
      });

      describe('and router have no shared but liked contents', function() {
        beforeEach(function() {
          this.visFetchModel.set({
            shared: 'no',
            liked:  true
          });
        });

        it("should return the URL to liked conents", function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/liked');
        });
      });

      describe('and router have shared and locked contents', function() {
        beforeEach(function() {
          this.visFetchModel.set({
            shared: 'only',
            locked: true
          });
        });

        it('should return the URL to the shared and locked contents', function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/shared/locked');
        });

        it('should return the URL to the shared and locked contents', function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/shared/locked');
        });
      });

      describe('and router have library content', function() {
        beforeEach(function() {
          this.visFetchModel.set({
            library: true
          });
        });

        it('should return the URL to library content', function() {
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/library');
        });
      });

      describe('and page is set', function() {
        it('should return the URL with page set', function() {
          this.visFetchModel.set({ page: 42 });
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets/42');
        });

        it('should return the URL with page ommitted if set to 1', function() {
          this.visFetchModel.set({ page: 1 });
          expect(this.model.forCurrentState().toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
        });
      });
    });

    describe('given a search tag', function() {
      it('should return the URL to see contents tagged with the given tag', function() {
        expect(this.model.forCurrentState({ search: ':foobar' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/tag/foobar');
      });

      it('should URL encode the search string', function() {
        expect(this.model.forCurrentState({ search: ':foobar baz' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/tag/foobar%20baz');
      });
    });

    describe('given a search string', function() {
      it('should return the URL to see contents w/ name or desc of search string', function() {
        expect(this.model.forCurrentState({ search: 'baz' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/search/baz');
      });

      it('should URL encode the search string', function() {
        expect(this.model.forCurrentState({ search: 'baz baz' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/search/baz%20baz');
      });
    });

    describe('given an empty search str', function() {
      beforeEach(function() {
        this.visFetchModel.set('q', 'prev');
        this.visFetchModel.set('tag', 'tag');
      });

      it('should return a URL w/o search or tag', function() {
        expect(this.model.forCurrentState({ search: '' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
      });
    });

    describe('given a page param', function() {
      describe('and the page is set to 1', function() {
        it('should return a URL with the page ommitted', function() {
          expect(this.model.forCurrentState({ page: 1 }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
        });
      });

      describe('and the page is set to something larger than 1', function() {
        it('should return a URL with the page set', function() {
          expect(this.model.forCurrentState({ page: 42 }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/42');
        });
      });
    });

    describe('given a locked param', function() {
      it('should return a URL with the locked set to the value of locked', function() {
        expect(this.model.forCurrentState({ locked: true }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/locked');
        expect(this.model.forCurrentState({ locked: false }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
      });
    });

    describe('given a shared param', function() {
      it('should return a URL without the shared param', function() {
        this.visFetchModel.set('shared', 'yes');
        expect(this.model.forCurrentState({ shared: 'no' }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
      });
    });

    describe('given a liked param', function() {
      it('should return a URL without the liked param', function() {
        this.visFetchModel.set('liked', true);
        expect(this.model.forCurrentState({ liked: false }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets');
        this.visFetchModel.set('shared', 'only');
        expect(this.model.forCurrentState({ liked: true }).toString()).toEqual('http://pepe.carto.com/dashboard/datasets/shared');
      });
    });
  });
});
