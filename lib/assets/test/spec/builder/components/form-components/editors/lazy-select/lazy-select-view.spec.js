var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('components/form-components/editors/lazy-select', function () {
  var dispatchDocumentEvent = function (type, opts) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, false, true);
    if (opts.which) {
      e.which = opts.which;
    }
    document.dispatchEvent(e, opts);
  };

  var createViewFn = function (options) {
    var model = new Backbone.Model({
      names: 'pepe',
      latitude: undefined
    });

    var configModel = new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    var nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a1',
      source: 'a0'
    }, {
      configModel: configModel,
      collection: new Backbone.Collection()
    });

    var querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    nodeDefModel.querySchemaModel = querySchemaModel;

    var defaultOptions = {
      key: 'names',
      schema: {
        options: [{
          columna: 'foo'
        }, {
          columna: 'bar'
        }, {
          columna: 'carto'
        }]
      },
      model: model,
      configModel: configModel,
      nodeDefModel: nodeDefModel,
      column: 'columna'
    };

    var view = new Backbone.Form.editors.LazySelect(_.extend(defaultOptions, options));

    view.render();

    return view;
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  afterEach(function () {
    this.view && this.view.remove();
  });

  it('should genereate an options collection', function () {
    this.view = this.createView();

    expect(this.view.searchCollection).toBeDefined();
    expect(this.view.searchCollection.size()).toBe(3);
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view = this.createView();

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('pepe');
    });

    it('should render custom placeholder if provided', function () {
      this.view = this.createView({
        placeholder: 'quinoa',
        keyAttr: 'latitude'
      });

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('quinoa');
    });

    it('should pass searchPlaceholder to CustomListView if present', function () {
      var text = 'Search Machine';
      this.view = this.createView({
        searchPlaceholder: text
      });

      expect(this.view._listView.options.searchPlaceholder).toEqual(text);
    });

    it('should disable the component if option is true', function () {
      this.view = this.createView();

      this.view.options.disabled = true;
      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
    });

    it('should add is-empty class if there is no value selected', function () {
      this.view = this.createView();

      this.view.model.set({names: ''});
      this.view.setValue('');

      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  describe('bindings', function () {
    beforeEach(function () {
      this.view = this.createView();
      spyOn(this.view._listView, 'hide');
    });

    it('should close list view if ESC is pressed', function () {
      dispatchDocumentEvent('keydown', { which: 27 });
      expect(this.view._listView.hide).toHaveBeenCalled();
    });

    it('should close list view if user clicks out the select', function () {
      dispatchDocumentEvent('click', { target: 'body' });
      expect(this.view._listView.hide).toHaveBeenCalled();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('on ENTER pressed', function () {
    beforeEach(function () {
      this.view = this.createView();
      spyOn(this.view._listView, 'toggle');
      this._event = $.Event('keydown');
      this._event.which = 13;
    });

    it('should open custom list', function () {
      this.view.$('.js-button').trigger(this._event);
      expect(this.view._listView.toggle).toHaveBeenCalled();
    });

    it('should not open custom list if it is already visible', function () {
      this.view._listView.show();
      this.view.$('.js-button').trigger(this._event);
      expect(this.view._listView.toggle).not.toHaveBeenCalled();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  it('should change button value and hide list when a new item is selected', function () {
    this.view = this.createView();
    spyOn(this.view._listView, 'hide');
    var mdl = this.view.searchCollection.where({ val: 'carto' });
    mdl[0].set('selected', true);
    expect(this.view.$('.js-button').text()).toContain('carto');
    expect(this.view.$('.js-button').hasClass('is-empty')).toBeFalsy();
    expect(this.view._listView.hide).toHaveBeenCalled();
  });

  it('should open list view if "button" is clicked', function () {
    this.view = this.createView();
    spyOn(this.view._listView, 'toggle');
    this.view.$('.js-button').trigger('click');
    expect(this.view._listView.toggle).toHaveBeenCalled();
  });

  describe('placeholder', function () {
    it('empty and no value', function () {
      this.view = this.createView({
        keyAttr: 'latitude',
        schema: {
          options: []
        }
      });

      var placeholder = $.trim(this.view.$('.js-button').text());
      expect(placeholder).toBe('components.backbone-forms.select.empty');
    });

    it('no value', function () {
      this.view = this.createView({
        keyAttr: 'latitude'
      });

      var placeholder = $.trim(this.view.$('.js-button').text());
      expect(placeholder).toBe('components.backbone-forms.select.placeholder');
    });
  });
});
