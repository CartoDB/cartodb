var IconView = require('../../../../../../javascripts/cartodb/organization/icon_picker/icons/organization_icon_view');
var IconModel = require('../../../../../../javascripts/cartodb/organization/icon_picker/icons/organization_icon_model');

describe('organization/icon_picker/icons/organization_icon_view', function () {
  beforeEach(function () {
    var orgId = '5p3c724-1ndv572135';
    this.model = new IconModel({
      public_url: 'some_url'
    }, {
      orgId: orgId
    });
    this.view = new IconView({
      model: this.model
    });
  });

  describe('initialize', function () {
    it('should call _initBinds and hook `click`', function () {
      expect(this.view.events.click).toEqual('_onClick');
      expect(this.view.model._callbacks['change:selected']).toBeDefined();
      expect(this.view.model._callbacks['change:deleted']).toBeDefined();
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$('.IconItem-icon').length).toBe(1);
      expect(this.view.$('img').attr('src')).toEqual(this.model.get('public_url'));
      expect(this.view.$('img').attr('crossorigin')).toEqual('anonymous');
    });
  });

  describe('_onClick', function () {
    it('should toggle selected state', function () {
      var selected = this.view.model.get('selected');
      this.view.render();

      this.view._onClick();

      expect(this.view.model.get('selected')).toBe(!selected);

      this.view._onClick();

      expect(this.view.model.get('selected')).toBe(selected);
    });
  });

  describe('_onSelectedChanged', function () {
    it('should toggle `is-selected` class', function () {
      spyOn(this.view, '_onSelectedChanged').and.callThrough();
      this.view._initBinds();

      this.view.render();

      expect(this.view.$el.hasClass('is-selected')).toBe(false);

      this.view.model.set('selected', true);

      expect(this.view.$el.hasClass('is-selected')).toBe(true);

      this.view.model.set('selected', false);

      expect(this.view.$el.hasClass('is-selected')).toBe(false);
      expect(this.view._onSelectedChanged).toHaveBeenCalledTimes(2);
    });
  });

  describe('_onDeletedChanged', function () {
    it('should remove element if is rendered and deleted', function () {
      this.view.render();
      spyOn(this.view.$el, 'remove').and.callThrough();

      this.view.model.set('deleted', true);

      expect(this.view.$el.remove).toHaveBeenCalled();
    });

    it('should remove element if is rendered and deleted', function () {
      this.view.render();
      spyOn(this.view.$el, 'remove').and.callThrough();

      this.view.model.set('deleted', false);

      expect(this.view.$el.remove).not.toHaveBeenCalled();
    });
  });
});
