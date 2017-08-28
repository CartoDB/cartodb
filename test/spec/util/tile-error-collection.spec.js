var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var TileErrorCollection = require('../../../src/util/tile-error-collection');

describe('util/tile-error-collection', function () {
  var interceptAjaxCall;
  beforeEach(function () {
    interceptAjaxCall = null;

    this.error = { type: 'limit', message: 'Some message' };
    this.tiles = [
      new Backbone.Model({ url: 'some_url/0/0/0/1.png', node: new Image() }),
      new Backbone.Model({ url: 'some_url/0/0/0/2.png', node: new Image() }),
      new Backbone.Model({ url: 'some_url/0/0/0/3.png', node: new Image(), error: this.error })
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

  describe('on add event', function () {
    var tile = {
      url: 'some_url/0/0/0/4.png',
      node: new Image()
    };

    it('should set the error tile overlay when a new model is added', function () {
      this.collection.add(tile);
      var model = _.last(this.collection.models);
      expect(model.get('node').src.indexOf('data:image/svg+xml;base64,')).not.toBe(-1);
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

    it('should call ._getTileErrors if running is false', function () {
      spyOn(this.collection, '_getTileErrors');

      this.collection.running = true;
      this.collection.add(tile);
      expect(this.collection._getTileErrors).not.toHaveBeenCalled();

      this.collection.running = false;
      this.collection.add(tile);
      expect(this.collection._getTileErrors).toHaveBeenCalled();
    });
  });

  describe('.getError', function () {
    it('should return an error if any tile have it', function () {
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
    describe('when all models have been checked or there are no models', function () {
      it('should set running to false', function () {
        this.collection.running = true;
        this.collection._getTileErrors();

        expect(this.collection.running).toBe(false);

        this.collection.running = true;
        this.collection.queue.add({ url: 'somethig.png', tile: new Image(), checked: true });
        this.collection._getTileErrors();

        expect(this.collection.running).toBe(false);
      });
    });

    describe('when there are models to check', function () {
      xit('should set running to true', function () {
        // TODO: Test this
      });

      describe('when the model is not in the DOM anymore', function () {
        beforeEach(function () {
          spyOn(this.collection, '_deletedNode').and.returnValue(true);
        });

        it('should remove the model from the queue', function () {
          this.collection.queue.add({ url: 'somethig.png', tile: new Image() });
          this.collection._getTileErrors();

          expect(this.collection.queue.length).toEqual(0);
        });

        it('should call ._getTileErrors()', function () {
          spyOn(this.collection, '_getTileErrors').and.callThrough();

          this.collection.queue.add({ url: 'somethig.png', tile: new Image() });
          this.collection._getTileErrors();

          expect(this.collection._getTileErrors.calls.count()).toEqual(2);
        });
      });

      describe('when the model still in the DOM', function () {
        beforeEach(function () {
          interceptAjaxCall = function (params) {
            if (/\.png/.test(params.url)) {
              params.complete && params.complete();
            }
          };
          spyOn(this.collection, '_deletedNode').and.returnValue(false);
          spyOn(this.collection, '_getTileErrors').and.callThrough();
          this.model = this.collection.queue.add({ url: 'http://localhost:9001/test/some_url/0/0/0/5.png', node: new Image() });
        });

        it('should set the model as checked', function () {
          this.collection._getTileErrors();
          expect(this.model.get('checked')).toBe(true);
        });

        it('should call ._getTileErrors()', function () {
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

          it('should set the model url as the model node src', function () {
            expect(this.model.get('node').src).toEqual('');
            this.collection._getTileErrors();
            expect(this.model.get('node').src).toEqual(this.model.get('url'));
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
  });

  afterEach(function () {
    $.ajax = this.originalAjax;
    this.collection.queue = [];
    this.collection.running = false;
    this.collection.reset(this.tiles);
  });
});
