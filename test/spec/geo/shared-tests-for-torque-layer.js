/**
 * Shared behavior for all torque layer view.
 *
 * Should be called in the context of a torque-layer spec, e.g.:
 *   SharedTestsForTorqueLayer.call(this);
 *
 * Expects this.view to be present as an instance of the torque layer view,
 * and should be re-created between each test run (i.e. create it in the beforeEach closure).
 */
module.exports = function () {
  describe('(shared tests for a torque layer view)', function () {
    it('should setup initial values on model', function () {
      expect(this.view.model.get('step')).toEqual(0);
      expect(this.view.model.get('time')).toBeDefined(); // number of Date? varies between leaflet and gmaps
      expect(this.view.model.get('steps')).toEqual(100);
      expect(this.view.model.get('isRunning')).toBe(true);
    });

    describe('when step attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.view, 'play');
        spyOn(this.view, 'pause');
      });

      it('should pause/play', function () {
        this.view.model.set('isRunning', false);
        expect(this.view.play).not.toHaveBeenCalled();
        expect(this.view.pause).toHaveBeenCalled();
        this.view.model.set('isRunning', true);
        expect(this.view.play).toHaveBeenCalled();
      });
    });

    describe('when step attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.view, 'setStep');
        this.view.model.set('step', 123);
      });

      it('should setStep when step attr changes on model', function () {
        expect(this.view.setStep).toHaveBeenCalledWith(123);
      });
    });

    describe('when steps attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.view, 'setSteps');
        this.view.model.set('steps', 512);
      });

      it('should setSteps when steps attr changes on model', function () {
        expect(this.view.setSteps).toHaveBeenCalledWith(512);
      });
    });

    describe('when renderRange attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.view, 'renderRange');
        spyOn(this.view, 'resetRenderRange');
      });

      it('should update renderRange if there are values', function () {
        this.view.model.set('renderRange', {start: 0, end: 100});
        expect(this.view.renderRange).toHaveBeenCalledWith(0, 100);
        expect(this.view.resetRenderRange).not.toHaveBeenCalled();
      });

      it('should reset renderRange if there are no values set', function () {
        this.view.model.set('renderRange', null);
        expect(this.view.resetRenderRange).toHaveBeenCalled();

        this.view.resetRenderRange.calls.reset();
        this.view.model.set('renderRange', {});
        expect(this.view.resetRenderRange).toHaveBeenCalled();
      });
    });

    describe('when change:time is triggered', function () {
      beforeEach(function () {
        spyOn(this.view, 'setStep');
        spyOn(this.view, 'renderRange');
        this.view.trigger('change:time', {
          step: 1,
          time: 9000,
          start: 0,
          end: 100
        });
      });

      it('should update model', function () {
        expect(this.view.model.get('step')).toEqual(1);
        expect(this.view.model.get('time')).toEqual(9000);
        expect(this.view.model.get('renderRange')).toEqual({start: 0, end: 100});
      });

      it('should not call view methods again', function () {
        expect(this.view.setStep).not.toHaveBeenCalled();
        expect(this.view.renderRange).not.toHaveBeenCalled();
      });
    });

    describe('when change:steps is triggered', function () {
      beforeEach(function () {
        spyOn(this.view, 'setSteps');
        this.view.trigger('change:steps', {steps: 1234});
      });

      it('should update model', function () {
        expect(this.view.model.get('steps')).toEqual(1234);
      });

      it('should not call view methods again', function () {
        expect(this.view.setSteps).not.toHaveBeenCalled();
      });
    });

    describe('when play/pause is triggered', function () {
      beforeEach(function () {
        spyOn(this.view.model, 'pause').and.callThrough();
        spyOn(this.view.model, 'play').and.callThrough();
        spyOn(this.view, 'pause').and.callThrough();
        spyOn(this.view, 'play').and.callThrough();
      });

      it('should call model play/pause when triggered on view', function () {
        this.view.pause();
        expect(this.view.model.pause).toHaveBeenCalled();
        expect(this.view.pause.calls.count()).toEqual(1); // verify that view is not called again

        this.view.play();
        expect(this.view.model.play).toHaveBeenCalled();
        expect(this.view.play.calls.count()).toEqual(1); // verify that view is not called again
      });
    });
  });
};
