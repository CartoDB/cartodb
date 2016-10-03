var Map = require('../../../../src/geo/map');
var Zoom = require('../../../../src/geo/ui/zoom/zoom-view');
var Template = require('../../../../src/core/template');

describe('geo/ui/zoom', function () {
  beforeEach(function () {
    this.map = new Map(null, { layersFactory: {} });
    spyOn(this.map, 'bind').and.callThrough();
    spyOn(this.map, 'setZoom').and.callThrough();
    this.view = new Zoom({
      model: this.map,
      template: Template.compile(' ' +
        '<div class="CDB-Overlay">' +
        '<button class="CDB-Zoom-action CDB-Zoom-action--out js-zoomOut"></button>' +
        '<button class="CDB-Zoom-action CDB-Zoom-action--in js-zoomIn"></button>' +
        '</div>' +
        '<div class="CDB-Zoom-info">-</div>')
    });
    this.view.render();
  });

  it('should have bindings when map zoom has any change', function () {
    expect(this.map.bind.calls.argsFor(0)[0]).toEqual('change:zoom change:minZoom change:maxZoom');
    expect(this.map.bind.calls.argsFor(0)[1]).toEqual(this.view._checkZoom);
  });

  describe('zoom in', function () {
    beforeEach(function () {
      this.$zoomIn = this.view.$('.js-zoomIn');
    });

    it('should zoom in when button is clicked', function () {
      this.$zoomIn.click();
      expect(this.map.setZoom).toHaveBeenCalled();
      expect(this.$zoomIn.hasClass('is-disabled')).toBeFalsy();
    });

    it('should not zoom in if max zoom is reached', function () {
      this.map.set({
        zoom: 3,
        maxZoom: 3
      });
      this.$zoomIn.click();
      expect(this.map.setZoom).not.toHaveBeenCalled();
    });

    it('should add a is-disabled class when it is not possible to zoom in', function () {
      this.map.set({
        zoom: 3,
        maxZoom: 3
      });
      expect(this.$zoomIn.hasClass('is-disabled')).toBeTruthy();
    });
  });

  describe('zoom out', function () {
    beforeEach(function () {
      this.$zoomOut = this.view.$('.js-zoomOut');
    });

    it('should zoom out when button is clicked', function () {
      this.$zoomOut.click();
      expect(this.map.setZoom).toHaveBeenCalled();
      expect(this.$zoomOut.hasClass('is-disabled')).toBeFalsy();
    });

    it('should not zoom in if min zoom is reached', function () {
      this.map.set({
        zoom: 3,
        minZoom: 3
      });
      this.$zoomOut.click();
      expect(this.map.setZoom).not.toHaveBeenCalled();
    });

    it('should add a is-disabled class when it is not possible to zoom out', function () {
      this.map.set({
        zoom: 3,
        minZoom: 3
      });
      expect(this.$zoomOut.hasClass('is-disabled')).toBeTruthy();
    });
  });
});
