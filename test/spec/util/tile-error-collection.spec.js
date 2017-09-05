var Backbone = require('backbone');
var $ = require('jquery');
var TileErrorCollection = require('../../../src/util/tile-error-collection');

describe('util/tile-error-collection', function () {
  var interceptAjaxCall;
  var ajaxCallsCount = 0;

  beforeEach(function () {
    interceptAjaxCall = null;

    this.error = { type: 'limit', message: 'Some message' };
    this.tiles = [
      new Backbone.Model({ url: 'some_url/0/0/0/1.png', tileDomNode: {} }),
      new Backbone.Model({ url: 'some_url/0/0/0/2.png', tileDomNode: {} }),
      new Backbone.Model({ url: 'some_url/0/0/0/3.png', tileDomNode: {} })
    ];
    this.collection = new TileErrorCollection(this.tiles);

    this.originalAjax = $.ajax;
    $.ajax = function (params) {
      interceptAjaxCall && interceptAjaxCall(params);
      return {
        complete: function (cb) {
          cb();
          return this;
        },
        success: function (cb) {
          cb();
          return this;
        },
        error: function (cb) {
          cb();
          return this;
        }
      };
    };
  });

  describe('._onAdd', function () {
    var tile = {
      url: 'some_url/0/0/0/4.png',
      tileDomNode: {}
    };

    describe('when running is true', function () {
      it('should set the error tile overlay when a new model is added', function () {
        spyOn(document.body, 'contains').and.returnValue(true);
        var model = this.collection.add(tile);
        expect(model.get('tileDomNode').src.indexOf('data:image/svg+xml;base64,')).not.toBe(-1);
      });

      it('should add the model to the qeue if is not there', function () {
        // Set running to true to prevent ._getTileErrors from being called
        // since the image is not in the DOM and will be removed from the queue
        this.collection.running = true;

        this.collection.add(tile);
        expect(this.collection.queue.length).toEqual(1);

        this.collection.add(tile);
        expect(this.collection.queue.length).toEqual(1);
      });
    });

    describe('when running is false', function () {
      it('should set running to true', function () {
        this.collection.running = false;
        this.collection.add(tile);
        expect(this.collection.running).toBe(true);
      });

      it('should call ._getTileErrors ', function () {
        spyOn(this.collection, '_getTileErrors');

        this.collection.running = true;
        this.collection.add(tile);
        expect(this.collection._getTileErrors).not.toHaveBeenCalled();

        this.collection.running = false;
        this.collection.add(tile);
        expect(this.collection._getTileErrors).toHaveBeenCalled();
      });
    });
  });

  describe('.getError', function () {
    it('should return an error if any tile have it', function () {
      this.collection.models[0].set('error', this.error);

      expect(this.collection.getError()).toEqual(this.error);
    });
  });

  describe('.resetErrorTiles', function () {
    it('should remove the tiles if they\'re not in the DOM', function () {
      spyOn(this.collection, '_deletedNode').and.returnValue(true);
      this.collection.resetErrorTiles();

      expect(this.collection.models).toEqual([]);
    });
  });

  describe('._getTileErrors', function () {
    describe('when we already have the error or there are no models to check', function () {
      it('should set running to false', function () {
        this.collection.running = true;
        this.collection._getTileErrors();

        expect(this.collection.running).toBe(false);

        this.collection.running = true;
        this.collection.queue.add({ url: 'somethig.png', tile: {}, checked: true });
        this.collection._getTileErrors();

        expect(this.collection.running).toBe(false);

        this.collection.running = true;
        this.collection.models[0].set('error', this.error);
        this.collection._getTileErrors();
        expect(this.collection.running).toBe(false);
      });
    });

    describe('when there are models to check', function () {
      beforeEach(function () {
        interceptAjaxCall = function (params) {
          if (/\.png/.test(params.url)) {
            params.complete && params.complete();
          }
        };
        spyOn(this.collection, '_deletedNode').and.returnValue(false);
        spyOn(this.collection, '_getTileErrors').and.callThrough();

        this.collection.running = true;
        this.model = this.collection.queue.add({ url: 'http://localhost:9001/test/some_url/0/0/0/5.png', tileDomNode: {} });
      });

      it('should set the model as checked', function () {
        expect(this.model.get('checked')).toBe(undefined);
        this.collection._getTileErrors();
        expect(this.model.get('checked')).toBe(true);
      });

      it('should call ._getTileErrors()', function () {
        // It should call itself because of recursion, to keep the queue working
        this.collection._getTileErrors();
        expect(this.collection._getTileErrors.calls.count()).toEqual(2);
      });

      describe('when the request success', function () {
        beforeEach(function () {
          interceptAjaxCall = function (params) {
            if (/\.png/.test(params.url)) {
              params.success && params.success();
            }
          };
        });

        it('should set the model url as the model tileDomNode src', function () {
          expect(this.model.get('tileDomNode').src).toEqual(undefined);
          this.collection._getTileErrors();
          expect(this.model.get('tileDomNode').src).toEqual(this.model.get('url'));
        });
      });

      describe('when the request fails', function () {
        beforeEach(function () {
          interceptAjaxCall = function (params) {
            if (/\.png/.test(params.url)) {
              params.error && params.error({
                responseJSON: {
                  errors_with_context: [{
                    type: 'limit',
                    message: 'Some error happened'
                  }]
                }
              });
            }
          };
        });

        it('should set the error in the model', function () {
          this.collection._getTileErrors();
          expect(this.model.get('error')).toEqual({
            type: 'limit',
            message: 'Some error happened'
          });
        });
      });
    });
  });

  describe('when adding a tile to the collection', function  () {
    it('should make only one request per tile', function () {
      var ajaxDone;
      var tile = { url: 'some_url/0/0/0/4.png', tileDomNode: {} };
      interceptAjaxCall = function (params) {
        if (/\.png/.test(params.url)) {
          ajaxDone = true
        }
      };

      ajaxDone = false;
      this.collection.add(tile);
      expect(ajaxDone).toBe(true);

      ajaxDone = false;
      this.collection.add(tile);
      expect(ajaxDone).toBe(false);
    });

    it('should stop making Ajax calls if we already have the error', function () {
      var error = {
        responseJSON: {
          errors_with_context: [{
            type: 'limit',
            message: 'Some error happened'
          }]
        }
      };
      interceptAjaxCall = function (params) {
        if (/\.png/.test(params.url)) {
          ajaxCallsCount += 1;

          ajaxCallsCount === 2
            ? params.error && params.error(error)
            : params.complete && params.complete();
        }
      };

      this.collection.add({ url: 'some_url/0/0/0/4.png', tileDomNode: {}});
      this.collection.add({ url: 'some_url/0/0/0/5.png', tileDomNode: {}});
      this.collection.add({ url: 'some_url/0/0/0/6.png', tileDomNode: {}});
      this.collection.add({ url: 'some_url/0/0/0/7.png', tileDomNode: {}});
      expect(ajaxCallsCount).toBe(2);
    });

    afterEach(function () {
      ajaxCallsCount = 0;
    });
  });

  afterEach(function () {
    $.ajax = this.originalAjax;
    this.collection.queue = [];
    this.collection.running = false;
    this.collection.reset(this.tiles);
  });
});
