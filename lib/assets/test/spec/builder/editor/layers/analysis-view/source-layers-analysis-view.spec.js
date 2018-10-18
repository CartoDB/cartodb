var Backbone = require('backbone');
var UserModel = require('builder/data/user-model');
var SourceLayerAnalysisView = require('builder/editor/layers/analysis-views/source-layer-analysis-view');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ConfigModel = require('builder/data/config-model');
var TableModel = require('builder/data/table-model');
var _ = require('underscore');
var $ = require('jquery');

describe('editor/layers/analysis-views/source-layer-analysis-view', function () {
  var $el;

  beforeEach(function () {
    $el = $('<div class="js-layer"><div class="js-Editor-ListLayer-titleText"></div></div>');

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({
      username: 'chacho'
    }, {
      configModel: this.configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([{
      id: 'a0',
      type: 'source',
      table_name: 'foo_bar',
      params: {
        query: 'SELECT * FROM foo_bar'
      }
    }], {
      configModel: this.configModel,
      userModel: this.userModel
    });
    this.sourceAnalysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get('a0');
    this.layerDefinitionModel = new Backbone.Model({user_name: 'somebody'});
    this.layerDefinitionModel.getQualifiedTableName = function () {};

    this.view = new SourceLayerAnalysisView({
      model: this.sourceAnalysisDefinitionNodeModel,
      analysisNode: this.sourceAnalysisDefinitionNodeModel,
      layerDefinitionModel: this.layerDefinitionModel
    });
  });

  afterEach(function () {
    $el.remove();
  });

  describe('.render', function () {
    it('should render correctly', function () {
      this.view.render();

      expect(this.view.$el.text()).toContain('a0');
      expect(this.view.$el.text()).toContain('foo_bar');
      expect(_.size(this.view._subviews)).toBe(1); // [tooltip]
    });

    describe('when layer is sync', function () {
      var syncView;

      beforeEach(function () {
        var table = new TableModel({
          id: 'harrr',
          name: 'another_table',
          synchronization: {
            id: 'test'
          }
        }, {
          parse: true,
          configModel: this.configModel
        });

        spyOn(this.sourceAnalysisDefinitionNodeModel, 'getTableModel').and.returnValue(table);

        syncView = new SourceLayerAnalysisView({
          model: this.sourceAnalysisDefinitionNodeModel,
          analysisNode: this.sourceAnalysisDefinitionNodeModel,
          layerDefinitionModel: this.layerDefinitionModel
        });

        syncView.render();
      });

      it('should render correctly', function () {
        expect(syncView.$el.html()).toContain('CDB-IconFont CDB-IconFont-wifi');
        expect(_.size(syncView._subviews)).toBe(2); // [tooltip, sync tooltip]
      });
    });

    describe('when custom query is applied', function () {
      beforeEach(function () {
        spyOn(this.view._analysisNode, 'isCustomQueryApplied').and.returnValue(true);
        this.view.render();
      });

      it('should render correctly', function () {
        expect(this.view.$el.html()).toContain('js-sql');
        expect(this.view.$('.js-sql').html()).toContain('SQL');
        expect(_.size(this.view._subviews)).toBe(2); // [tooltip, customQuery tooltip]
      });
    });
  });

  describe('._initBinds', function () {
    it('should call _toggleHover on _stateModel change highlighted', function () {
      spyOn(this.view, '_toggleHover');
      this.view._initBinds();
      this.view._stateModel.trigger('change:highlighted');

      expect(this.view._toggleHover).toHaveBeenCalled();
    });

    it('should call render on _tableNodeModel change synchronization', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      this.view._tableNodeModel.trigger('change:synchronization');

      expect(this.view.render).toHaveBeenCalled();
    });
  });

  describe('._onMouseEnter', function () {
    it('should set _stateModel highlighted to true', function () {
      expect(this.view._stateModel.get('highlighted')).toBe(false);

      this.view._onMouseEnter();

      expect(this.view._stateModel.get('highlighted')).toBe(true);
    });
  });

  describe('._onMouseLeave', function () {
    it('should set _stateModel highlighted to false', function () {
      this.view._stateModel.set('highlighted', true, { silent: true });
      expect(this.view._stateModel.get('highlighted')).toBe(true);

      this.view._onMouseLeave();

      expect(this.view._stateModel.get('highlighted')).toBe(false);
    });
  });

  describe('._toggleHover', function () {
    it('should toggle hover', function () {
      $el.append(this.view.render().el);

      this.view._stateModel.set('highlighted', true, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(true);
      expect($el.find('.js-Editor-ListLayer-titleText').hasClass('is-hover')).toBe(true);

      this.view._stateModel.set('highlighted', false, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(false);
      expect($el.find('.js-Editor-ListLayer-titleText').hasClass('is-hover')).toBe(false);
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
