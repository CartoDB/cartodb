var Urls = require('new_dashboard/router/urls/model');

describe("new_dashboard/router/urls/model", function() {
  beforeEach(function() {
    this.routerModel = new cdb.core.Model({
      content_type: 'contents',
      shared:       false,
      liked:        false,
      locked:       false
    });

    this.rootUrl = 'http://pepe.cartodb.com';

    this.urls = new Urls({
      routerModel: this.routerModel,
      rootUrl:     this.rootUrl
    })
  });

  describe('.root', function() {
    describe('given no fragment', function() {
      it('should return the root URL', function() {
        expect(this.urls.root()).toEqual(this.rootUrl);
      });
    });

    describe('given a fragment', function() {
      it('should return the URL to a page from the root', function() {
        expect(this.urls.root('/dashboard/datasets/library')).toEqual(this.rootUrl +'/dashboard/datasets/library');
      });
    });
  });

  describe('.contentType', function() {
    describe('given no fragment', function() {
      it("should return the URL to a content page's root", function() {
        expect(this.urls.contentType()).toEqual(this.rootUrl +'/dashboard/contents');
      });
    });

    describe('given a fragment', function() {
      it("should return the URL to a subpath under a content's page", function() {
        expect(this.urls.contentType('/loving')).toEqual(this.rootUrl +'/dashboard/contents/loving');
      });
    });
  });

  describe('.to', function() {
    describe('given no fragment', function() {
      it("should return the URL to current page's state", function() {
        expect(this.urls.to()).toEqual(this.rootUrl +'/dashboard/contents');
      });
    });

    describe('given a fragment', function() {
      it("should return the URL to a subpath under the current page's state", function() {
        expect(this.urls.to('/fragment')).toEqual(this.rootUrl +'/dashboard/contents/fragment');
      });
    });

    describe('given a router model state', function() {
      it("should return the URL to a subpath under the current page's state", function() {
        this.routerModel.set('shared', true);
        expect(this.urls.to('/fragment')).toEqual(this.rootUrl +'/dashboard/contents/shared/fragment');

        this.routerModel.set({
          shared: false,
          liked:  true
        });
        expect(this.urls.to('/fragment')).toEqual(this.rootUrl +'/dashboard/contents/liked/fragment');

        this.routerModel.set({
          shared: true,
          locked: true
        });
        expect(this.urls.to('/fragment')).toEqual(this.rootUrl +'/dashboard/contents/shared/locked/fragment');
      });
    });
  });

  describe('.tag', function() {
    beforeEach(function() {
      this.routerModel.set({
        liked: true,
        locked: true
      });
    });

    it("should return the URL to a search of a tag within the state of the current page", function() {
      expect(this.urls.tag('foobar')).toEqual(this.rootUrl +'/dashboard/contents/liked/locked/tag/foobar');
    });

    describe('given a tag that is not URL safe', function() {
      it("should return the URL and with the tag url-encoded", function() {
        expect(this.urls.tag('foobar baz')).toEqual(this.rootUrl +'/dashboard/contents/liked/locked/tag/foobar%20baz');
      });
    });
  });
});
