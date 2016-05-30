var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');

describe('stack-layout/model', function () {
  beforeEach(function () {
    this.collection = new Backbone.Collection([
      new cdb.core.Model(),
      new cdb.core.Model()
    ]);
    this.model = new StackLayoutModel({}, {
      stackLayoutItems: this.collection
    });
  });

  it('should start with position 0', function () {
    expect(this.model.get('position')).toBe(0);
  });

  describe('.goToStep', function () {
    beforeEach(function () {
      spyOn(this.model, 'trigger').and.callThrough();
    });

    it('should move to a given position', function () {
      expect(this.model.get('position')).toBe(0);
      this.model.goToStep(1);
      expect(this.model.get('position')).toBe(1);
    });

    it('should not move to a non existant position', function () {
      expect(this.model.get('position')).toBe(0);
      expect(function () { this.model.goToStep(1000); }).toThrowError();
      expect(this.model.get('position')).toBe(0);
    });

    it('should trigger one position change', function () {
      this.model.goToStep(1, 'hello buddy');
      var args = this.model.trigger.calls.argsFor(0);
      expect(args[0]).toEqual('positionChanged');
      expect(args[1]).toEqual(1);
      expect(args[2][0]).toEqual('hello buddy');
      expect(this.model.trigger.calls.count()).toBe(1);
    });
  });

  describe('.nextStep', function () {
    beforeEach(function () {
      this.positionChangedSpy = jasmine.createSpy('positionChanged');
      this.model.on('positionChanged', this.positionChangedSpy);
      this.model.nextStep('hello', 'buddy');
    });

    afterEach(function () {
      this.model.off('positionChanged', this.positionChangedSpy);
    });

    it('should move to next position', function () {
      expect(this.model.get('position')).toBe(1);
    });

    it('should trigger a positionChanged event', function () {
      expect(this.positionChangedSpy).toHaveBeenCalledWith(1, ['hello', 'buddy']);
    });

    describe('when already on last position of the stack', function () {
      beforeEach(function () {
        this.positionChangedSpy.calls.reset();
        spyOn(_, 'defer');

        this.model.nextStep('hola', 'amigo');
      });

      it('should not move to a non existant position', function () {
        expect(this.model.get('position')).toBe(1);
      });

      it('should trigger a positionChanged event though', function () {
        expect(this.positionChangedSpy).toHaveBeenCalledWith(1, ['hola', 'amigo']);
      });

      it('should throw a deferred error with a helpful message for developer on how to fix the issue', function () {
        expect(_.defer).toHaveBeenCalled();
        expect(function () {
          _.defer.calls.argsFor(0)[0]();
        }).toThrowError(/goToStep instead/);
      });
    });
  });

  describe('.prevStep', function () {
    beforeEach(function () {
      this.model.nextStep();
      spyOn(this.model, 'trigger').and.callThrough();
    });

    it('should move to previous position', function () {
      expect(this.model.get('position')).toBe(1);
      this.model.prevStep();
      expect(this.model.get('position')).toBe(0);
    });

    it('should not move to a non existant position', function () {
      this.model.prevStep();
      expect(this.model.get('position')).toBe(0);
      expect(this.model.prevStep).toThrowError();
    });

    it('should trigger one position change', function () {
      this.model.prevStep('go back!');
      var args = this.model.trigger.calls.argsFor(0);
      expect(args[0]).toEqual('positionChanged');
      expect(args[1]).toEqual(0);
      expect(args[2][0]).toEqual('go back!');
      expect(this.model.trigger.calls.count()).toBe(1);
    });
  });
});
