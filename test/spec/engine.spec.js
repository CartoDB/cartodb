var Engine = require('../../src/engine');

fdescribe('Engine', function () {
  describe('Constructor', function () {
    it('Should throw a descriptive error when called with no parameters', function () {
      expect(function () {
        new Engine(); // eslint-disable-line
      }).toThrowError('new Engine() called with no paramters');
    });
  });

  describe('events', function () {
    var engine;
    var spy;
    beforeEach(function () {
      engine = new Engine({});
      spy = jasmine.createSpy('spy');
    });
    describe('on', function () {
      it('Should register a callback thats called for "fake-event"', function () {
        engine.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engine._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('off', function () {
      it('Should unregister a callback', function () {
        engine.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engine._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
        engine.off('fake-event', spy);
        engine._eventEmmitter.trigger('fake-event');
        expect(spy.calls.count()).toBe(1);
      });
    });
  });
});
