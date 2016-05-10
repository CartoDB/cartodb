var $ = require('jquery');
var InputColor = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-color');

describe('components/form-components/editors/fill/input-color', function () {
  beforeEach(function () {
    this.model = new cdb.core.Model({
      bins: 5,
      range: ['#FFF', '#FABADA', '#00FF00', '#000', '#99999'],
      attribute: 'name',
      quantification: 'Jenks',
      opacity: 0.5
    });
    this.view = new InputColor(({
      model: this.model,
      columns: ['column1', 'column2', 'column3']
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

  describe('fixed value', function () {
    beforeEach(function () {
      this.model = new cdb.core.Model({
        fixed: '#FF0000'
      });
      this.view = new InputColor(({
        model: this.model,
        columns: ['column1', 'column2', 'column3']
      }));
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.CDB-ColorBar').css('background-color')).toContain('rgb(255, 0, 0)');
    });

    it('should update when the value is changed', function () {
      this.model.set('fixed', '#00FF00');
      expect(this.view.$('.CDB-ColorBar').css('background-color')).toContain('rgb(0, 255, 0)');
    });
  });

  describe('range', function () {
    beforeEach(function () {
      this.model = new cdb.core.Model({
        bins: 5,
        range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
        attribute: 'name',
        quantification: 'Jenks',
        opacity: 0.5
      });
      this.view = new InputColor(({
        model: this.model,
        columns: ['column1', 'column2', 'column3']
      }));
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.CDB-ColorBar').length).toBe(1);
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(255, 255, 255)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(250, 186, 218)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(0, 255, 0)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(0, 0, 0)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(153, 153, 153)');
    });

    it('should update when the value is changed', function () {
      this.model.set('range', ['#FFFFFF', '#FFFF00', '#0000FF']);
      expect(this.view.$('.CDB-ColorBar').length).toBe(1);
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(255, 255, 255)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(255, 255, 0)');
      expect($(this.view.$('.CDB-ColorBar')).css('background')).toContain('rgb(0, 0, 255)');
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
