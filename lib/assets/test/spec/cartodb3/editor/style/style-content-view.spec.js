var Backbone = require('backbone');
var _ = require('underscore');
var StyleContentView = require('../../../../../javascripts/cartodb3/editor/style/style-content-view');
var StyleDefinitionModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/style/style-content-view', function () {
  beforeEach(function () {
    this.model = new StyleDefinitionModel();
    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'unfetched'
    }, {
      configModel: {}
    });
    this.layerDefinitionModel = new Backbone.Model();
    spyOn(this.layerDefinitionModel, 'save');
    spyOn(this.querySchemaModel, 'fetch');
    spyOn(StyleContentView.prototype, 'render').and.callThrough();
    this.view = new StyleContentView({
      configModel: {},
      layerDefinitionsCollection: new Backbone.Collection(),
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      modals: {},
      styleModel: this.model
    });
    this.view.render();
  });

  it('should fetch query schema model if it is unfetched', function () {
    expect(this.querySchemaModel.fetch).toHaveBeenCalled();
  });

  describe('._initBinds', function () {
    it('should render when query schema is fetched', function () {
      StyleContentView.prototype.render.calls.reset();
      this.querySchemaModel.set('status', 'fetched');
      expect(StyleContentView.prototype.render).toHaveBeenCalled();
    });

    it('should render when styleModel is undone or redone', function () {
      StyleContentView.prototype.render.calls.reset();
      var fill = _.clone(this.model.get('fill'));
      fill.size = 34;
      this.model.set('fill', fill);
      expect(StyleContentView.prototype.render).not.toHaveBeenCalled();
      this.model.undo();
      expect(StyleContentView.prototype.render).toHaveBeenCalled();
      this.model.redo();
      expect(StyleContentView.prototype.render.calls.count()).toBe(2);
    });

    it('should change cartocss_custom property when styleModel changes', function () {
      var fill = _.clone(this.model.get('fill'));
      fill.size = 34;
      this.model.set('fill', fill);
      expect(this.layerDefinitionModel.save).toHaveBeenCalledWith({ cartocss_custom: false });
    });
  });

  describe('.render', function () {
    it('should render "placeholder" if query schema model is not fetched', function () {
      expect(this.view.$('.FormPlaceholder-paragraph').length).toBe(4);
      expect(_.size(this.view._subviews)).toBe(0);
    });

    it('should render properly when query schema is fetched', function () {
      this.querySchemaModel.set('status', 'fetched');
      this.view.render();
      expect(this.view.$('.Carousel').length).toBe(1);
      expect(this.view.$('.Editor-HeaderInfo').length).toBe(2);
      expect(_.size(this.view._subviews)).toBe(2);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
