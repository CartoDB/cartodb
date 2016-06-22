var Backbone = require('backbone');
var InputColor = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-color');
var rampList = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-ramps/ramps');

describe('components/form-components/editors/fill/input-color', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      bins: 5,
      range: ['#FFF', '#FABADA', '#00FF00', '#000', '#99999'],
      attribute: 'column1',
      quantification: 'jenks',
      opacity: 0.5
    });
    this.view = new InputColor(({
      model: this.model,
      configModel: {},
      query: 'SELECT * from table',
      columns: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ]
    }));
    this.view.render();
  });

  it('should get selected', function () {
    this.model.set('selected', true);
    expect(this.view.$el.hasClass('is-active')).toBeTruthy();
  });

  it('should create a content view', function () {
    expect(this.view.model.get('createContentView')).toBeDefined();
  });

  it('should trigger a click event when clicked', function () {
    var clickEvent = false;
    this.view.bind('click', function () {
      clickEvent = true;
    });
    this.view.$el.click();
    expect(clickEvent).toBeTruthy();
  });

  describe('range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 5,
        range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
        attribute: 'column1',
        quantification: 'Jenks',
        opacity: 0.5
      });
      this.view = new InputColor(({
        model: this.model,
        configModel: {},
        query: 'SELECT * from table',
        columns: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      }));
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.ColorBar').length).toBe(1);
    });

    it('should update when the value is changed', function () {
      this.model.set('range', ['#FFFFFF', '#FFFF00', '#0000FF']);
      expect(this.view.$('.ColorBar').length).toBe(1);
    });
  });

  describe('migrate old range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 5,
        range: 'inverted_green',
        attribute: 'column1',
        quantification: 'jenks',
        opacity: 0.5
      });
      this.view = new InputColor(({
        model: this.model,
        configModel: {},
        query: 'SELECT * from table',
        columns: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      }));
      this.view.render();
    });

    it('should migrate the range', function () {
      expect(this.model.get('range')).toBe(rampList['inverted_green'][5]);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
