var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var InputColorFixedContentView = require('builder/components/form-components/editors/fill/input-color/input-color-fixed-content-view');
var FactoryModals = require('../../../../../factories/modals');

describe('components/form-components/editors/fill/input-color/input-color-fixed-content-view', function () {
  beforeEach(function () {
    spyOn($, 'ajax').and.callFake(function (req) {
      var container = document.createElement('div');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '200');
      svg.setAttribute('version', '1.1');
      svg.setAttribute('id', 'mysvg');
      container.appendChild(svg);

      var d = $.Deferred();
      d.resolve(container);
      return d.promise();
    });

    this._configModel = new ConfigModel({ base_url: '/u/pepe' });

    this.model = new Backbone.Model({
      image: '',
      fixed: '#ff0000',
      opacity: 1
    });
  });

  describe('with image enabled', function () {
    beforeEach(function () {
      spyOn(InputColorFixedContentView.prototype, '_updateImageTabPane').and.callThrough();
      spyOn(InputColorFixedContentView.prototype, '_updateTextTabPane').and.callThrough();

      this.view = new InputColorFixedContentView({
        model: this.model,
        editorAttrs: {
          imageEnabled: true,
          hidePanes: ['value']
        },
        userModel: {
          featureEnabled: function () { return true; }
        },
        configModel: this._configModel,
        modals: FactoryModals.createModalService()
      });

      this.view.render();
    });

    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$el.find('.CDB-NavMenu-item').length).toBe(2);
      expect(this.view._tabPaneView).toBeDefined();
    });

    it('should update color', function () {
      expect(this.view.$('.Editor-boxModalHeader').html()).toContain('#ff0000');
      this.model.set('fixed', '#fabada');
      expect(InputColorFixedContentView.prototype._updateTextTabPane).toHaveBeenCalled();
      expect(InputColorFixedContentView.prototype._updateImageTabPane).toHaveBeenCalled();
      expect(this.view.$('.Editor-boxModalHeader').html()).toContain('#fabada');
    });

    it('should update image', function () {
      expect(this.view.$('.Editor-boxModalHeader').text()).toContain('form-components.editors.fill.input-color.img');
      this.model.set('image', 'http://image.io/image1.svg');
      expect(InputColorFixedContentView.prototype._updateTextTabPane).not.toHaveBeenCalled();
      expect(InputColorFixedContentView.prototype._updateImageTabPane).toHaveBeenCalled();
      expect(this.view.$('.Editor-boxModalHeader').html()).toContain('<div class="Tab-paneLabelImageContainer js-image-container">');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('without image enabled', function () {
    beforeEach(function () {
      this.view = new InputColorFixedContentView({
        model: this.model,
        editorAttrs: {
          hidePanes: ['value']
        }
      });

      this.view.render();
    });

    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$el.find('.CDB-NavMenu-item').length).toBe(0);
      expect(this.view._tabPaneView).not.toBeDefined();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
