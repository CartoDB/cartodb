var Backbone = require('backbone');
var InputColorCategories = require('builder/components/input-color/input-qualitative-ramps/main-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FactoryModals = require('../../../../../../factories/modals');
var rampList = require('cartocolor');
var cdb = require('internal-carto.js');

describe('components/form-components/editors/fill/input-color/input-qualitative-ramps/main-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel,
      feature_flags: []
    });

    this.model = new Backbone.Model({
      domain: [0, '', 'Three'],
      range: ['#E7E1EF', '#C994C7', '#DD1C77'],
      images: ['', '', ''],
      attribute: 'column1',
      quantification: 'jenks'
    });

    this.modals = FactoryModals.createModalService();

    spyOn(cdb.SQL.prototype, 'execute').and.callFake(function (query, vars, params) {
      params && params.success();
    });

    this.view = new InputColorCategories(({
      model: this.model,
      userModel: this.userModel,
      modals: this.modals,
      query: 'SELECT * FROM table',
      columns: [
        { label: 'column1', type: 'string' },
        { label: 'column2', type: 'string' },
        { label: 'column3', type: 'number' }
      ],
      configModel: this.configModel
    }));

    this.view.render();
  });

  describe('.render', function () {
    it('should have a back button', function () {
      expect(this.view.$('.js-prevStep')).toBeDefined();
    });

    it('should display the attribute name in the header', function () {
      expect(this.view.$('.js-label').text()).toEqual(this.model.get('attribute'));
    });

    it('should display color ranges with 4 colors', function () {
      // 4 colors = 3 domain values colors + Others color
      var fistRange = this.view.$('.ColorBarContainer')[0];
      expect(fistRange.children.length).toEqual(4);
    });

    it('should display a button to select a custom color set', function () {
      expect(this.view.$('.js-custom-color-set')).toBeDefined();
    });
  });

  it('should not render quantification if hideTabs is defined and quantification is one of the items', function () {
    this.view.render();
    expect(this.view.$el.html()).toContain('js-quantification');
    this.view._hideTabs = ['quantification'];
    this.view.render();
    expect(this.view.$el.html()).not.toContain('js-quantification');
    this.view._hideTabs = [];
    this.view.render();
    expect(this.view.$el.html()).toContain('js-quantification');
  });

  it('should show the loader', function () {
    // Not providing any response, we will let the loader be showed forever
    cdb.SQL.prototype.execute.and.callFake(function (query, vars, params) { });

    this.model.set('attribute', 'column2');
    expect(this.view.$('.js-loader').length).toBe(1);
    expect(this.view.$('.InputColorCategory-content.js-content').length).toBe(0);
  });

  describe('._createColorPickerView', function () {
    it('should set picker view opacity to 1 when no opacity is provided', function () {
      this.view.model.set('opacity', undefined);

      var pickerView = this.view._createColorPickerView();

      expect(pickerView.model.get('opacity')).toBe(1);
    });

    it('should set picker view opacity to the value provided', function () {
      var opacity = 0.83;
      this.view.model.set('opacity', opacity);

      var pickerView = this.view._createColorPickerView();

      expect(pickerView.model.get('opacity')).toBe(opacity);
    });

    it('should subscribe to picker view change of opacity', function () {
      this.view.model.set('opacity', 0.83);
      var pickerView = this.view._createColorPickerView();

      pickerView.model.set('opacity', 0.69);

      expect(this.view.model.get('opacity')).toBe(0.69);
    });

    it('should enable image edition if the item is not the latest', function () {
      this.view._index = 0;
      this.view.options.imageEnabled = true;

      var pickerView = this.view._createColorPickerView();

      expect(pickerView.options.imageEnabled).toBe(true);
    });

    it('should disable image edition if the item is the latest', function () {
      var MAX_VALUES = 10; // Mirror the constant from input-color-categories.js
      this.view._index = MAX_VALUES;
      this.view.options.imageEnabled = true;

      var pickerView = this.view._createColorPickerView();

      expect(pickerView.options.imageEnabled).toBe(false);
    });
  });

  describe('._createRangeListView', function () {
    it('should not add the img selector to the latest item', function () {
      this.view.options.imageEnabled = true;

      var rangeListView = this.view._createRangeListView();
      var list = rangeListView.render().$el.find('.CustomList-item');

      expect(list.last().find('RampItem-img').length).toBe(0);
    });
  });

  describe('._updateRangeAndDomain', function () {
    var MAX_VALUES = 10; // Mirror the constant from input-color-categories.js

    it('updates correctly the domain and range colors for the current categories', function () {
      var rows = JSON.parse('[{"nombre":"Almagro"},{"nombre":"Arapiles"},{"nombre":"Cortes"},{"nombre":"Embajadores"},{"nombre":"Gaztambide"},{"nombre":"Jerónimos"},{"nombre":"Justicia"},{"nombre":"Palacio"},{"nombre":"RiosRosas"},{"nombre":"Sol"},{"nombre":"Trafalgar"}]');
      this.view.model.set({ 'attribute': 'nombre' }, { silent: true });

      this.view._updateRangeAndDomain(rows);

      expect(this.view.model.get('domain').length).toBe(10);
      expect(this.view.model.get('range')[MAX_VALUES]).toBe(rampList.Prism[MAX_VALUES + 1][MAX_VALUES + 1]);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
