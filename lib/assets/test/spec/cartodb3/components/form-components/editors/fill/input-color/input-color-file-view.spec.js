var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var InputColorFileView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-color-file-view');

describe('components/form-components/editors/fill/input-color/input-color-file-view', function () {
  describe('on model with a range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        image: 'http://www.domain.com/image.png',
        fixed: '#ff0000'
      });

      this._configModel = new ConfigModel({ base_url: '/u/pepe' });
      this.view = new InputColorFileView(({
        model: this.model,
        userModel: {
          featureEnabled: function () { return true; }
        },
        configModel: this._configModel,
        modals: {
          create: function () {}
        }
      }));

      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$el.html()).toContain('form-components.editors.fill.image.recently-title');
      expect(this.view.$el.find('.js-asset').length).toBe(115);
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
