var Backbone = require('backbone');
var StackLayoutModel = require('builder/components/stack-layout/stack-layout-model');

describe('stack-layout/model', function () {
  beforeEach(function () {
    this.collection = new Backbone.Collection([
      new Backbone.Model(),
      new Backbone.Model()
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

    it('should not move to a non existant position', function () {
      this.model.goToStep(1);
      expect(this.model.get('position')).toBe(1);
      expect(function () {
        this.model.nextStep('hola', 'amigo');
      }.bind(this)).toThrowError();
      expect(this.model.get('position')).toBe(1);
    });

    it('should trigger a positionChanged event', function () {
      expect(this.positionChangedSpy).toHaveBeenCalledWith(1, ['hello', 'buddy']);
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

    it('should trigger a positionChanged event', function () {
      this.model.prevStep('go back!');
      var args = this.model.trigger.calls.argsFor(0);
      expect(args[0]).toEqual('positionChanged');
      expect(args[1]).toEqual(0);
      expect(args[2][0]).toEqual('go back!');
      expect(this.model.trigger.calls.count()).toBe(1);
    });
  });

  describe('.goBack', function () {
    beforeEach(function () {
      spyOn(this.model, 'trigger').and.callThrough();
    });

    it("should do nothing if position hasn't changed yet", function () {
      expect(this.model.get('position')).toBe(0);
      this.model.goBack();
      expect(this.model.get('position')).toBe(0);
      expect(this.model.trigger).not.toHaveBeenCalled();
    });

    describe('when position has previously changed', function () {
      beforeEach(function () {
        this.model.goToStep(1, 'hello', 'buddy');
        this.model.goToStep(0, 'hola', 'amigo');
        this.model.trigger.calls.reset();
      });

      it('should move to the "previous" position', function () {
        this.model.goBack();
        expect(this.model.get('position')).toBe(1);

        this.model.goBack();
        expect(this.model.get('position')).toBe(0);
      });

      it('should trigger a positionChanged event with the right args', function () {
        this.model.goBack();
        expect(this.model.trigger).toHaveBeenCalledWith('positionChanged', 1, [ 'hello', 'buddy' ]);
        this.model.trigger.calls.reset();

        this.model.goBack();
        expect(this.model.trigger).toHaveBeenCalledWith('positionChanged', 0, [ 'hola', 'amigo' ]);
      });
    });
  });
});
