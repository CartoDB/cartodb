var Backbone = require('backbone');
var _ = require('underscore');
var LegendsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legends-view');
var UserActions = require('../../../../../../../javascripts/cartodb3/data/user-actions');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/layers/layer-content-view/legend/legends-view', function () {
  beforeEach(function () {
    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };

    this.layerDefinitionModel = new Backbone.Model();

    spyOn(LegendsView.prototype, '_changeStyle');
    spyOn(LegendsView.prototype, '_quitEditing');

    this.view = new LegendsView({
      userActions: this.userActions,
      layerDefinitionModel: this.layerDefinitionModel,
      editorModel: this.editorModel,
      querySchemaModel: this.querySchemaModel
    });

    this.view.render();
  });

  it('should render sql error message', function () {
    this.view.modelView.set({state: 'error'});
    this.view.render();

    expect(_.size(this.view._subviews)).toBe(0);
    expect(this.view.$el.text()).toContain('editor.error-query.body');
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1); // tabPane
    expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.color');
    expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.size');
  });

  it('should bind events properly', function () {
    this.editorModel.set({edition: true});
    expect(LegendsView.prototype._changeStyle).toHaveBeenCalled();
  });

  it('should close editor if the user changes tab', function () {
    this.view._layerTabPaneView.collection.trigger('change:selected');
    expect(LegendsView.prototype._quitEditing).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

