var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var InputColorFileView = require('builder/components/form-components/editors/fill/input-color/input-color-file-view');
var utils = require('builder/helpers/utils');
var MakiIcons = require('builder/components/form-components/editors/fill/input-color/assets/maki-icons');
var FactoryModals = require('../../../../../factories/modals');

describe('components/form-components/editors/fill/input-color/input-color-file-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      image: 'http://www.domain.com/image.png',
      fixed: '#ff0000',
      index: 0,
      ramp: [{
        color: '#c0ffee',
        title: 'hola',
        image: 'http://www.image.com/image.jpg'
      }]
    });

    this._configModel = new ConfigModel({ base_url: '/u/pepe' });
    this.view = new InputColorFileView(({
      model: this.model,
      userModel: {
        featureEnabled: function () { return true; }
      },
      configModel: this._configModel,
      modals: FactoryModals.createModalService()
    }));

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.html()).toContain('form-components.editors.fill.image.recently-title');
    expect(this.view.$el.find('.js-asset').length).toBe(MakiIcons.icons.length + 1); // None + icons
    expect(utils.endsWith(this.view.$('img').attr('src'), '?req=markup')).toBe(true);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
