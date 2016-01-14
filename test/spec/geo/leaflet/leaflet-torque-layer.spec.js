/* global L */
var $ = require('jquery');

describe('geo/leaflet/leaflet-torque-layer', function () {
  beforeEach(function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    this.map = new cdb.geo.Map();
    this.mapView = new cdb.geo.LeafletMapView({
      el: container,
      map: this.map
    });

    var layerURL = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png';
    this.layer = new cdb.geo.TileLayer({ urlTemplate: layerURL });
    this.model = new cdb.geo.TorqueLayer({ type: 'torque', sql: 'select * from table', cartocss: '#test {}' });
    this.map.addLayer(this.model);
    this.view = this.mapView.layers[this.model.cid];
  });

  it('should reuse layer view', function () {
    expect(this.view instanceof L.TorqueLayer).toEqual(true);

    this.view.check = 'testing';
    var newLayer = this.model.clone();
    newLayer.set({ sql: 'select * from table', cartocss: '#test {}' });
    this.map.layers.reset([newLayer]);

    expect(this.mapView.layers[newLayer.cid] instanceof L.TorqueLayer).toEqual(true);
    expect(this.mapView.layers[newLayer.cid].model).toEqual(newLayer);
    expect(this.mapView.layers[newLayer.cid].check).toEqual('testing');
  });

  it('should setup initial values on model', function () {
    expect(this.model.get('step')).toEqual(0);
    expect(this.model.get('time')).toEqual(jasmine.any(Date));
    expect(this.model.get('steps')).toEqual(100);
    expect(this.model.get('isRunning')).toBe(true);
  });

  describe('when step attr changes on model', function () {
    beforeEach(function () {
      spyOn(this.view, 'play');
      spyOn(this.view, 'pause');
    });

    it('should pause/play', function () {
      this.model.set('isRunning', false);
      expect(this.view.play).not.toHaveBeenCalled();
      expect(this.view.pause).toHaveBeenCalled();
      this.model.set('isRunning', true);
      expect(this.view.play).toHaveBeenCalled();
    });
  });

  describe('when step attr changes on model', function () {
    beforeEach(function () {
      spyOn(this.view, 'setStep');
      this.model.set('step', 123);
    });

    it('should setStep when step attr changes on model', function () {
      expect(this.view.setStep).toHaveBeenCalledWith(123);
    });
  });

  describe('when steps attr changes on model', function () {
    beforeEach(function () {
      spyOn(this.view, 'setSteps');
      this.model.set('steps', 512);
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
      this.model.set('renderRange', {start: 0, end: 100});
      expect(this.view.renderRange).toHaveBeenCalledWith(0, 100);
      expect(this.view.resetRenderRange).not.toHaveBeenCalled();
    });

    it('should reset renderRange if there are no values set', function () {
      this.model.set('renderRange', null);
      expect(this.view.resetRenderRange).toHaveBeenCalled();

      this.view.resetRenderRange.calls.reset();
      this.model.set('renderRange', {});
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
      expect(this.model.get('step')).toEqual(1);
      expect(this.model.get('time')).toEqual(9000);
      expect(this.model.get('renderRange')).toEqual({start: 0, end: 100});
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
      expect(this.model.get('steps')).toEqual(1234);
    });

    it('should not call view methods again', function () {
      expect(this.view.setSteps).not.toHaveBeenCalled();
    });
  });

  describe('when play/pause is triggered', function () {
    beforeEach(function () {
      spyOn(this.model, 'pause').and.callThrough();
      spyOn(this.model, 'play').and.callThrough();
      spyOn(this.view, 'pause').and.callThrough();
      spyOn(this.view, 'play').and.callThrough();
    });

    it('should call model play/pause when triggered on view', function () {
      this.view.pause();
      expect(this.model.pause).toHaveBeenCalled();
      expect(this.view.pause.calls.count()).toEqual(1); // verify that view is not called again

      this.view.play();
      expect(this.model.play).toHaveBeenCalled();
      expect(this.view.play.calls.count()).toEqual(1); // verify that view is not called again
    });
  });
});
