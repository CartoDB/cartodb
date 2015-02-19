var RouterModel = require('new_dashboard/router/model');

describe("new_dashboard/router/model", function() {
  beforeEach(function() {
    var self = this;
    this.rootUrlForCurrentType = 'http://pepe.cartodb.com/dashboard/contents';
    this.rootUrlForCurrentTypeFn = function() {
      return { toDefault: function() { return self.rootUrlForCurrentType } };
    };
    
    this.model = new RouterModel({
      rootUrlForCurrentTypeFn: this.rootUrlForCurrentTypeFn,
      content_type: 'contents',
      shared: false,
      page: 1
    })
  });

  describe('.url', function() {
    describe('given no args', function() {
      it('should return the URL with page 1 ommitted', function() {
        expect(this.model.url()).toEqual(this.rootUrlForCurrentType);
      });

      describe('and default state', function() {
        it("should return the URL to the contents without any filters", function() {
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType);
        });
      });

      describe('and router have shared contents', function() {
        beforeEach(function() {
          this.model.set('shared', true);
        });

        it('should return the URL to the shared contents', function() {
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType +'/shared');
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
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType +'/liked');
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
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType +'/shared/locked');
        });
      });

      describe('and router have library content', function() {
        beforeEach(function() {
          this.model.set({
            library: true
          });
        });

        it('should return the URL to library content', function() {
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType +'/library');
        });
      });

      describe('and page is set', function() {
        it('should return the URL with page set', function() {
          this.model.set({ page: 42 });
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType +'/42');
        });

        it('should return the URL with page ommitted if set to 1', function() {
          this.model.set({ page: 1 });
          expect(this.model.url()).toEqual(this.rootUrlForCurrentType);
        });
      });
    });

    describe('given a search tag', function() {
      it('should return the URL to see contents tagged with the given tag', function() {
        expect(this.model.url({ search: ':foobar' })).toEqual(this.rootUrlForCurrentType +'/tag/foobar');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: ':foobar baz' })).toEqual(this.rootUrlForCurrentType +'/tag/foobar%20baz');
      });
    });

    describe('given a search string', function() {
      it('should return the URL to see contents w/ name or desc of search string', function() {
        expect(this.model.url({ search: 'baz' })).toEqual(this.rootUrlForCurrentType +'/search/baz');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: 'baz baz' })).toEqual(this.rootUrlForCurrentType +'/search/baz%20baz');
      });
    });

    describe('given an empty search str', function() {
      beforeEach(function() {
        this.model.set('q', 'prev');
        this.model.set('tag', 'tag');
      });

      it('should return a URL w/o search or tag', function() {
        expect(this.model.url({ search: '' })).toEqual(this.rootUrlForCurrentType);
      });
    });

    describe('given a page param', function() {
      describe('and the page is set to 1', function() {
        it('should return a URL with the page ommitted', function() {
          expect(this.model.url({ page: 1 })).toEqual(this.rootUrlForCurrentType);
        });
      });

      describe('and the page is set to something larger than 1', function() {
        it('should return a URL with the page set', function() {
          expect(this.model.url({ page: 42 })).toEqual(this.rootUrlForCurrentType +'/42');
        });
      });
    });

    describe('given a locked param', function() {
      it('should return a URL with the locked set to the value of locked', function() {
        expect(this.model.url({ locked: true })).toEqual(this.rootUrlForCurrentType +'/locked');
        expect(this.model.url({ locked: false })).toEqual(this.rootUrlForCurrentType);
      });
    });
  });
});
