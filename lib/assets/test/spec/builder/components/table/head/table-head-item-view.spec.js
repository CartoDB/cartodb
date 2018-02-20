var Backbone = require('backbone');
var $ = require('jquery');
var TableHeadItemView = require('builder/components/table/head/table-head-item-view');
var TableViewModel = require('builder/components/table/table-view-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var QueryColumnsCollection = require('builder/data/query-columns-collection');
var FactoryModals = require('../../../factories/modals');

var simulateESCKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = $.ui.keyCode.ESCAPE;
  $(document).trigger(e);
};

var simulateENTERKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = $.ui.keyCode.ENTER;
  $(document).trigger(e);
};

describe('components/table/head/table-head-item-view', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();
    var userModel = new UserModel({
      name: 'hello'
    }, {
      configModel: this.configModel
    });
    this.configModel.getSqlApiUrl = function () { return ''; };
    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from pepito',
      table_name: 'pepito',
      id: 'dummy-id'
    }, {
      configModel: this.configModel,
      userModel: userModel
    });

    this.columnsCollection = new QueryColumnsCollection([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'description',
        type: 'string'
      }
    ], {
      querySchemaModel: this.analysisDefinitionNodeModel.querySchemaModel,
      configModel: this.configModel
    });

    spyOn(this.columnsCollection, 'create');

    this.tableViewModel = new TableViewModel({
      tableName: 'pepito'
    }, {
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel,
      columnsCollection: this.columnsCollection
    });

    spyOn(this.analysisDefinitionNodeModel, 'isCustomQueryApplied').and.returnValue(false);
    spyOn(this.analysisDefinitionNodeModel, 'isReadOnly').and.returnValue(false);

    this.model = this.columnsCollection.at(1);
    spyOn(this.model, 'save');
    this.modals = FactoryModals.createModalService();
    this.view = new TableHeadItemView({
      model: this.model,
      columnsCollection: this.columnsCollection,
      tableViewModel: this.tableViewModel,
      simpleGeometry: 'point',
      modals: this.modals
    });
  });

  describe('column-options', function () {
    beforeEach(function () {
      this._makeClick = function () {
        this.view.$('.js-columnOptions').click();
      }.bind(this);
      this.view.render();
    });

    it('should open options when options is clicked', function () {
      this._makeClick();
      expect(this.view._menuView).toBeDefined();
    });

    it('should highlight/unhighlight when options is opened/closed', function () {
      this._makeClick();
      expect(this.view.$el.hasClass('is-highlighted')).toBeTruthy();
      simulateESCKeyPress();
      expect(this.view.$el.hasClass('is-highlighted')).toBeFalsy();
    });

    describe('table-binds', function () {
      beforeEach(function () {
        spyOn(this.view, '_initScrollBinding');
        spyOn(this.view, '_destroyScrollBinding');
      });

      it('should bind / unbind table scroll when it is opened / hidden', function () {
        this._makeClick();
        expect(this.view._initScrollBinding).toHaveBeenCalled();
        simulateESCKeyPress();
        expect(this.view._destroyScrollBinding).toHaveBeenCalled();
      });
    });

    describe('number of options', function () {
      it('should show all options', function () {
        this._makeClick();
        expect(this.view._menuView.collection.size()).toBe(5);
      });

      it('should not show all options when table view model is disabled', function () {
        spyOn(this.tableViewModel, 'isDisabled').and.returnValue(true);
        this._makeClick();
        expect(this.view._menuView.collection.size()).toBe(1);
      });

      it('should not show create/update/delete options if column is geometry', function () {
        spyOn(this.model, 'isGeometryColumn').and.returnValue(true);
        this.view.render();
        this._makeClick();
        var items = this.view._menuView.collection;
        expect(items.size()).toBe(2);
        expect(items.at(0).get('val')).toBe('order');
        expect(items.at(1).get('val')).toBe('create');
      });

      it('should not show create/update/delete options if column is cartodb_id', function () {
        spyOn(this.model, 'isCartoDBIDColumn').and.returnValue(true);
        this.view.render();
        this._makeClick();
        var items = this.view._menuView.collection;
        expect(items.size()).toBe(2);
        expect(items.at(0).get('val')).toBe('order');
        expect(items.at(1).get('val')).toBe('create');
      });
    });

    describe('actions', function () {
      beforeEach(function () {
        spyOn(this.tableViewModel, 'isDisabled').and.returnValue(false);
        spyOn(this.model, 'isEditable').and.returnValue(true);
        this._makeClick();
        this._menuView = this.view._menuView;
      });

      it('should change table-view-model when order is changed', function () {
        spyOn(this.tableViewModel, 'set');
        this._menuView.$('.js-asc').click();
        expect(this.tableViewModel.set).toHaveBeenCalledWith({ sort_order: 'asc', order_by: 'description' });
      });

      it('should start editing when rename option is clicked', function () {
        spyOn(this.view, '_startEditing');
        this._menuView.$('[data-val="rename"]').click();
        expect(this.view._startEditing).toHaveBeenCalled();
      });

      it('should change column type when change option and type is clicked', function () {
        spyOn(this.view, '_changeColumnType');
        this._menuView.$('[data-val="change"]').click();
        this._menuView.$('.Table-columnTypeMenu .js-listItem:eq(0)').click();
        expect(this.view._changeColumnType).toHaveBeenCalled();
      });

      it('should add a new column when change create is clicked', function () {
        spyOn(this.view, '_addColumn');
        this._menuView.$('[data-val="create"]').click();
        expect(this.view._addColumn).toHaveBeenCalled();
      });

      it('should remove column when remove option is clicked', function () {
        spyOn(this.view, '_removeColumn');
        this._menuView.$('[data-val="delete"]').click();
        expect(this.view._removeColumn).toHaveBeenCalled();
      });
    });
  });

  describe('rename', function () {
    beforeEach(function () {
      this.view.render();
      this.$input = this.view.$('.js-attribute');
      this._makeDblClick = function () {
        this.view.$('.js-attribute').dblclick();
      }.bind(this);
    });

    it('should let edit attribute name if double clicked over it', function () {
      spyOn(this.model, 'isEditable').and.returnValue(true);
      spyOn(this.tableViewModel, 'isDisabled').and.returnValue(true);
      spyOn(this.view, '_startEditing');

      this._makeDblClick();
      expect(this.view._startEditing).not.toHaveBeenCalled();

      this.tableViewModel.isDisabled.and.returnValue(false);
      this.model.isEditable.and.returnValue(false);
      this._makeDblClick();
      expect(this.view._startEditing).not.toHaveBeenCalled();

      this.model.isEditable.and.returnValue(true);
      this.tableViewModel.isDisabled.and.returnValue(false);
      this._makeDblClick();
      expect(this.view._startEditing).toHaveBeenCalled();
    });

    it('should add is-active class, remove readonly and bind changes when it is edited', function () {
      spyOn(this.view, '_initRenameBinds');
      this._makeDblClick();
      expect(this.$input.hasClass('is-active')).toBeTruthy();
      expect(this.$input.get(0).hasAttribute('readonly')).toBeFalsy();
      expect(this.view._initRenameBinds).toHaveBeenCalled();
    });

    it('should remove is-active class, add readonly and unbind changes when it is finished/closed', function () {
      this._makeDblClick();
      spyOn(this.view, '_destroyRenameBinds');
      simulateESCKeyPress();
      expect(this.$input.val()).toBe(this.model.get('name'));
      expect(this.$input.hasClass('is-active')).toBeFalsy();
      expect(this.$input.get(0).hasAttribute('readonly')).toBeTruthy();
      expect(this.view._destroyRenameBinds).toHaveBeenCalled();
    });

    it('should save name change when ENTER is pressed', function () {
      spyOn(this.view, '_saveNewName');
      this._makeDblClick();
      simulateENTERKeyPress();
      expect(this.view._saveNewName).toHaveBeenCalled();
    });

    it('should discard name change when ESC is pressed', function () {
      spyOn(this.view, '_saveNewName');
      this._makeDblClick();
      simulateESCKeyPress();
      expect(this.view._saveNewName).not.toHaveBeenCalled();
    });

    it('should open confirmation modal when name is changed', function () {
      spyOn(this.model, 'isEditable').and.returnValue(true);
      spyOn(this.modals, 'create');
      this._makeDblClick();
      this.$input.val('helloooo');
      simulateENTERKeyPress();
      expect(this.modals.create).toHaveBeenCalled();
    });
  });

  describe('.focusInput', function () {
    beforeEach(function () {
      this.view.render();
      this.$input = this.view.$('.js-attribute');
      this.$input.val('title');
    });

    it('should start editing', function () {
      spyOn(this.view, '_startEditing');
      this.view.focusInput();
      expect(this.view._startEditing).toHaveBeenCalled();
    });

    it('should select the input', function () {
      spyOn(this.$input[0], 'select');
      this.view.focusInput();
      expect(this.$input[0].select).toHaveBeenCalled();
    });
  });

  it('should disable scroll binding and document keypress when view is cleaned', function () {
    spyOn(this.view, '_destroyScrollBinding');
    spyOn(this.view, '_destroyRenameBinds');
    this.view.clean();
    expect(this.view._destroyScrollBinding).toHaveBeenCalled();
    expect(this.view._destroyRenameBinds).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
