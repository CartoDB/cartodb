var RouterModel = require('new_dashboard/router/model');

describe("new_dashboard/router/model", function() {
  beforeEach(function() {
    this.rootUrl = 'http://pepe.cartodb.com';
    this.currentUserUrl = { toStr: sinon.stub() };
    this.currentUserUrl.toStr.withArgs().returns(this.rootUrl);
    this.model = new RouterModel({
      currentUserUrl: this.currentUserUrl,
      content_type: 'contents',
      shared: false,
      page: 1
    })
  });

  describe('.contentUrl', function() {
    it("should return the URL to a content page's root", function() {
      expect(this.model.contentUrl()).toEqual(this.rootUrl +'/dashboard/contents');
    });
  });

  describe('.url', function() {
    describe('given no args', function() {
      it('should return the URL with page 1 ommitted', function() {
        expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents');
      });

      describe('and default state', function() {
        it("should return the URL to the contents without any filters", function() {
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents');
        });
      });

      describe('and router have shared contents', function() {
        beforeEach(function() {
          this.model.set('shared', true);
        });

        it('should return the URL to the shared contents', function() {
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents/shared');
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
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents/liked');
        });
      });

      describe('and router have shared and locked contents', function() {
        beforeEach(function() {
          this.model.set({
            shared: true,
            locked: true
          });
        });

        it('should return the URL to the shared and locked conents', function() {
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents/shared/locked');
        });
      });

      describe('and page is set', function() {
        it('should return the URL with page set', function() {
          this.model.set({ page: 42 });
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents/42');
        });

        it('should return the URL with page ommitted if set to 1', function() {
          this.model.set({ page: 1 });
          expect(this.model.url()).toEqual(this.rootUrl +'/dashboard/contents');
        });
      });
    });

    describe('given a search tag', function() {
      it('should return the URL to see contents tagged with the given tag', function() {
        expect(this.model.url({ search: ':foobar' })).toEqual(this.rootUrl +'/dashboard/contents/tag/foobar');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: ':foobar baz' })).toEqual(this.rootUrl +'/dashboard/contents/tag/foobar%20baz');
      });
    });

    describe('given a search string', function() {
      it('should return the URL to see contents w/ name or desc of search string', function() {
        expect(this.model.url({ search: 'baz' })).toEqual(this.rootUrl +'/dashboard/contents/search/baz');
      });

      it('should URL encode the search string', function() {
        expect(this.model.url({ search: 'baz baz' })).toEqual(this.rootUrl +'/dashboard/contents/search/baz%20baz');
      });
    });

    describe('given an empty search str', function() {
      beforeEach(function() {
        this.model.set('q', 'prev');
        this.model.set('tag', 'tag');
      });

      it('should return a URL w/o search or tag', function() {
        expect(this.model.url({ search: '' })).toEqual(this.rootUrl +'/dashboard/contents');
      });
    });

    describe('given a page param', function() {
      describe('and the page is set to 1', function() {
        it('should return a URL with the page ommitted', function() {
          expect(this.model.url({ page: 1 })).toEqual(this.rootUrl +'/dashboard/contents');
        });
      });

      describe('and the page is set to something larger than 1', function() {
        it('should return a URL with the page set', function() {
          expect(this.model.url({ page: 42 })).toEqual(this.rootUrl +'/dashboard/contents/42');
        });
      });
    });

    describe('given a locked param', function() {
      it('should return a URL with the locked set to the value of locked', function() {
        expect(this.model.url({ locked: true })).toEqual(this.rootUrl +'/dashboard/contents/locked');
        expect(this.model.url({ locked: false })).toEqual(this.rootUrl +'/dashboard/contents');
      });
    });
  });

  describe('.datasetsLibraryUrl', function() {
    beforeEach(function() {
      this.currentUserUrl = { toStr: sinon.stub() };
      this.currentUserUrl.toStr
        .withArgs('dashboard', 'datasets', 'library')
        .returns(this.rootUrl + '/dashboard/datasets/library');

      this.model = new RouterModel({
        currentUserUrl: this.currentUserUrl,
        content_type: 'contents',
        shared:        true,
        liked:         true,
        locked:        true
      });
      this.url = this.model.datasetsLibraryUrl();
    });

    it('should return the URL to datasets library', function() {
      expect(this.url).toEqual(this.rootUrl + '/dashboard/datasets/library');
    });

    it('should not contain any other state stuff', function() {
      expect(this.url).not.toContain('shared');
      expect(this.url).not.toContain('liked');
      expect(this.url).not.toContain('locked');
    });
  });

  describe('.sharedUrl', function() {
    beforeEach(function() {
      this.currentUserUrl = { toStr: sinon.stub() };
      this.currentUserUrl.toStr
        .returns(this.rootUrl);

      this.model = new RouterModel({
        currentUserUrl: this.currentUserUrl,
        content_type: 'contents',
        shared:        true,
        liked:         true,
        locked:        true
      });
      this.url = this.model.sharedUrl();
    });

    it('should return the URL to shared contents', function() {
      expect(this.url).toEqual(this.rootUrl +'/dashboard/contents/shared');
    });

    it('should not contain any other state stuff', function() {
      expect(this.url).not.toContain('liked');
      expect(this.url).not.toContain('locked');
    });
  });

  describe('.likedUrl', function() {
    beforeEach(function() {
      this.currentUserUrl = { toStr: sinon.stub() };
      this.currentUserUrl.toStr
        .returns(this.rootUrl);

      this.model = new RouterModel({
        currentUserUrl: this.currentUserUrl,
        content_type: 'contents',
        shared:        true,
        liked:         true,
        locked:        true
      });
      this.url = this.model.likedUrl();
    });

    it('should return the URL to liked contents', function() {
      expect(this.url).toEqual(this.rootUrl +'/dashboard/contents/liked');
    });

    it('should not contain any other state stuff', function() {
      expect(this.url).not.toContain('shared');
      expect(this.url).not.toContain('locked');
    });
  });

  describe('.lockedUrl', function() {
    beforeEach(function() {
      this.currentUserUrl = { toStr: sinon.stub() };
      this.currentUserUrl.toStr
        .returns(this.rootUrl);

      this.model = new RouterModel({
        currentUserUrl: this.currentUserUrl,
        content_type: 'contents',
        shared:        true,
        liked:         true
      });
      this.url = this.model.lockedUrl();
    });

    it('should return the URL to locked contents', function() {
      expect(this.url).toEqual(this.rootUrl +'/dashboard/contents/locked');
    });

    it('should not contain any other state stuff', function() {
      expect(this.url).not.toContain('shared');
      expect(this.url).not.toContain('liked');
    });
  });
});
