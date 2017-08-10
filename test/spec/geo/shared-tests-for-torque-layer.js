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
    beforeEach(function () {
      this.nativeTorqueLayer = this.view.nativeTorqueLayer;
    });

    it('should setup initial values on model', function () {
      expect(this.view.model.get('step')).toEqual(0);
      expect(this.view.model.get('time')).toBeDefined(); // number of Date? varies between leaflet and gmaps
      expect(this.view.model.get('steps')).toEqual(100);
      expect(this.view.model.get('isRunning')).toBe(true);
    });

    describe('when step attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'play');
        spyOn(this.nativeTorqueLayer, 'pause');
      });

      it('should pause/play', function () {
        this.view.model.set('isRunning', false);
        expect(this.nativeTorqueLayer.play).not.toHaveBeenCalled();
        expect(this.nativeTorqueLayer.pause).toHaveBeenCalled();
        this.view.model.set('isRunning', true);
        expect(this.nativeTorqueLayer.play).toHaveBeenCalled();
      });
    });

    describe('when step attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'setStep');
        this.view.model.set('step', 123);
      });

      it('should setStep when step attr changes on model', function () {
        expect(this.nativeTorqueLayer.setStep).toHaveBeenCalledWith(123);
      });
    });

    describe('when steps attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'setSteps');
        this.view.model.set('steps', 512);
      });

      it('should setSteps when steps attr changes on model', function () {
        expect(this.nativeTorqueLayer.setSteps).toHaveBeenCalledWith(512);
      });
    });

    describe('when renderRange attr changes on model', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'renderRange');
        spyOn(this.nativeTorqueLayer, 'resetRenderRange');
      });

      it('should update renderRange if there are values', function () {
        this.view.model.set('renderRange', {start: 0, end: 100});
        expect(this.nativeTorqueLayer.renderRange).toHaveBeenCalledWith(0, 100);
        expect(this.nativeTorqueLayer.resetRenderRange).not.toHaveBeenCalled();
      });

      it('should reset renderRange if there are no values set', function () {
        this.view.model.set('renderRange', null);
        expect(this.nativeTorqueLayer.resetRenderRange).toHaveBeenCalled();

        this.nativeTorqueLayer.resetRenderRange.calls.reset();
        this.view.model.set('renderRange', {});
        expect(this.nativeTorqueLayer.resetRenderRange).toHaveBeenCalled();
      });
    });

    describe('when change:time is fired', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'setStep');
        spyOn(this.nativeTorqueLayer, 'renderRange');
        this.nativeTorqueLayer.fire('change:time', {
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
        expect(this.nativeTorqueLayer.setStep).not.toHaveBeenCalled();
        expect(this.nativeTorqueLayer.renderRange).not.toHaveBeenCalled();
      });
    });

    describe('when change:steps is fired', function () {
      beforeEach(function () {
        spyOn(this.nativeTorqueLayer, 'setSteps');
        this.nativeTorqueLayer.fire('change:steps', {steps: 1234});
      });

      it('should update model', function () {
        expect(this.view.model.get('steps')).toEqual(1234);
      });

      it('should not call view methods again', function () {
        expect(this.nativeTorqueLayer.setSteps).not.toHaveBeenCalled();
      });
    });

    describe('when play/pause is triggered', function () {
      beforeEach(function () {
        spyOn(this.view.model, 'pause').and.callThrough();
        spyOn(this.view.model, 'play').and.callThrough();
        spyOn(this.nativeTorqueLayer, 'pause').and.callThrough();
        spyOn(this.nativeTorqueLayer, 'play').and.callThrough();
      });

      it('should call model play/pause when triggered on view', function () {
        this.nativeTorqueLayer.pause();
        expect(this.view.model.pause).toHaveBeenCalled();
        expect(this.nativeTorqueLayer.pause.calls.count()).toEqual(1); // verify that view is not called again

        this.nativeTorqueLayer.play();
        expect(this.view.model.play).toHaveBeenCalled();
        expect(this.nativeTorqueLayer.play.calls.count()).toEqual(1); // verify that view is not called again
      });
    });
  });

  describe('when cartocss attr changes on model', function () {
    beforeEach(function () {
      this.nativeTorqueLayer = this.view.nativeTorqueLayer;
      spyOn(this.nativeTorqueLayer, 'setCartoCSS');
    });

    it('should set the new cartoCSS on the torque layer', function () {
      this.view.model.set('cartocss', '#layer { marker-fill: whatever; }');
      expect(this.nativeTorqueLayer.setCartoCSS).toHaveBeenCalledWith('#layer { marker-fill: whatever; }');
    });
  });

  describe('when tileURLTemplates and subdomains attrs change on model', function () {
    beforeEach(function () {
      this.nativeTorqueLayer = this.view.nativeTorqueLayer;
      this.nativeTorqueLayer.provider = {
        subdomains: [ '0', '1', '2' ],
        options: {},
        _setReady: function () {}
      };
    });

    it('should set the new urlTemplate and subdomains on the torque provider', function () {
      this.view.model.set('tileURLTemplates', [ 'http://example.com/{z}/{x}/{y}.torque' ]);
      expect(this.nativeTorqueLayer.provider.templateUrl).toEqual('http://example.com/{z}/{x}/{y}.torque');
      expect(this.nativeTorqueLayer.provider.subdomains).toEqual([ '0', '1', '2' ]);
    });
  });
};
