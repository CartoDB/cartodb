var _ = require('underscore');
var Backbone = require('backbone');
var DatasetView = require('builder/dataset/dataset-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');

describe('dataset/dataset-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    var visModel = new Backbone.Model({
      privacy: 'public'
    });
    visModel.isVisualization = function () {};
    visModel.privacyOptions = function () {};

    var tableModel = new Backbone.Model();
    tableModel.getSyncModel = function () {};
    tableModel.isOwner = function () {};
    tableModel.getUnqualifiedName = function () {};
    tableModel.isSync = function () {};
    tableModel.getSyncModel = function () {
      return new Backbone.Model();
    };
    tableModel._permissionModel = {
      isOwner: function () {},
      hasWriteAccess: function () {}
    };

    var userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    var analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from table_1',
      table_name: 'table_1',
      id: 'dummy-id'
    }, {
      tableData: {
        permission: {
          owner: {
            username: 'pepe'
          }
        },
        synchronization: {}
      },
      configModel: configModel,
      userModel: userModel
    });

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () {};
    this.editorModel.isDisabled = function () {};

    this.view = new DatasetView({
      router: {},
      modals: {},
      editorModel: this.editorModel,
      configModel: configModel,
      userModel: userModel,
      visModel: visModel,
      analysisDefinitionNodeModel: analysisDefinitionNodeModel,
      layerDefinitionModel: {}
    });
  });

  afterEach(function () {
    this.view.clean();
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_initViews');

      this.view.render();
      expect(this.view.$el.html()).toContain('<div class="Dataset-viewInfo js-info"></div>');
      expect(this.view.$el.html()).toContain('<div class="Dataset-viewTable js-table"></div>');
      expect(this.view.$el.html()).toContain('<div class="Dataset-options js-datasetOptions"></div>');
      expect(this.view.$el.html()).toContain('<div class="Dataset-notifier js-notifier"></div>');
      expect(this.view.$el.html()).toContain('<a class="EditorMenu-logo js-editor-logo" href="/u/pepe/dashboard/datasets">');
      expect(this.view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(4);
    });
  });

  describe('._getDatasetOptionsElement', function () {
    it('should return the correct element', function () {
      this.view.render();

      var $element = this.view.$('.js-datasetOptions');
      expect($element.length).toEqual(1);
      expect(this.view._getDatasetOptionsElement()).toEqual($element);
    });
  });

  describe('._onToggleEdition', function () {
    it('should toggle is-dark class in js-datasetOptions based on editorModel.isEditing', function () {
      this.view.render();

      spyOn(this.editorModel, 'isEditing').and.returnValues(true, false);

      expect(this.view.$('.js-datasetOptions').hasClass('is-dark')).toBe(false);

      this.view._onToggleEdition();
      expect(this.view.$('.js-datasetOptions').hasClass('is-dark')).toBe(true);

      this.view._onToggleEdition();
      expect(this.view.$('.js-datasetOptions').hasClass('is-dark')).toBe(false);
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
