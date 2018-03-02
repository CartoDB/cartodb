var _ = require('underscore');
var Backbone = require('backbone');
var InputColorDialogContent = require('builder/components/form-components/editors/fill/input-color/input-color-dialog-content');
var FactoryModals = require('../../../../../factories/modals');

describe('components/form-components/editors/fill/input-color/input-color-dialog-content', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      bins: 5,
      range: ['#FFF', '#FABADA', '#00FF00', '#000', '#999999'],
      attribute: 'column1',
      quantification: 'jenks',
      opacity: 0.5
    });
    this.view = new InputColorDialogContent(({
      configModel: {},
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: FactoryModals.createModalService(),
      query: 'SELECT * from table',
      columns: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ],
      model: this.model,
      editorAttrs: {}
    }));
    this.view.render();
  });

  it('should render', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should generate two panes', function () {
    expect(this.view.$el.html()).toContain('form-components.editors.fill.input-color.solid');
    expect(this.view.$el.html()).toContain('form-components.editors.fill.input-color.value');
  });

  it('should populate hideTabs attribute if it is received as option', function () {
    var view = new InputColorDialogContent(({
      configModel: {},
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: FactoryModals.createModalService(),
      query: 'SELECT * from table',
      columns: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ],
      model: this.model,
      editorAttrs: {
        hideTabs: ['quantification']
      }
    }));
    expect(view._hideTabs).toEqual(['quantification']);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
