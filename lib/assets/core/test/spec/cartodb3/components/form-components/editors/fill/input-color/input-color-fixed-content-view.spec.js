var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var InputColorFixedContentView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-color-fixed-content-view');

describe('components/form-components/editors/fill/input-color/input-color-fixed-content-view', function () {
  beforeEach(function () {
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
        modals: {
          create: function () {}
        }
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
      expect(this.view.$('.Editor-boxModalHeader').html()).toContain('<div class="Tab-paneLabelImageContainer js-image-container"></div>');
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

    afterEach(function () {
      this.view.remove();
    });
  });
});
