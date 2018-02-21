var Backbone = require('backbone');
var _ = require('underscore');
var View = require('builder/components/form-components/editors/fill/input-color/assets-picker/static-asset-item-view');

describe('components/form-components/editors/fill/input-color/asset-picker/static-asset-item-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      state: ''
    });
    this.view = new View({ model: this.model });
  });

  describe('initialize', function () {
    it('should bind change:state that toggles selected', function () {
      expect(_.indexOf(this.view.$el[0].classList, 'is-selected')).toBe(-1);

      this.view.model.set('state', 'selected');

      expect(_.indexOf(this.view.$el[0].classList, 'is-selected')).not.toBe(-1);
    });
  });

  describe('._onClick', function () {
    it('should kill event, trigger selected and change model state', function () {
      var selectedTriggered = false;
      var selectedPayload;
      this.view.on('selected', function (payload) {
        selectedTriggered = true;
        selectedPayload = payload;
      });
      var event = 'an event';
      spyOn(this.view, 'killEvent');

      this.view._onClick(event);

      expect(this.view.killEvent).toHaveBeenCalledWith(event);
      expect(selectedTriggered).toBe(true);
      expect(selectedPayload).toBe(this.model);
      expect(this.view.model.get('state')).toBe('selected');
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  // render function is already tested in assets-list-view.spec.js render
});
