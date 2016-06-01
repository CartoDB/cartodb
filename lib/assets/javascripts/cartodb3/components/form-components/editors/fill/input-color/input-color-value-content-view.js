var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../column-list-view');
var InputColorValueContentView = require('../input-categories/input-color-value-content-view');
var InputCategoryDialogContent = require('../input-categories/input-categories-dialog-content');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.query) throw new Error('query param is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;

    this._column = this._getColumn();
    this._columnType = this._column && this._column.type;

    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createColumnListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputColorValueContentView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createTextCategoriesView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    if (this.model.get('attribute')) {
      if (this._columnType === 'number') {
        this._stackLayoutView.model.set('position', 1);
      } else if (this._columnType === 'string') {
        this._stackLayoutView.model.set('position', 2);
      }
    }
  },

  _createTextCategoriesView: function (stackLayoutModel, opts) {
    var view = new InputCategoryDialogContent({
      model: this.model,
      query: this._query,
      columns: this._columns,
      configModel: this._configModel
    });

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  },

  _createInputColorValueContentView: function (stackLayoutModel, opts) {
    var view = new InputColorValueContentView({
      model: this.model
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    return view;
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _createColumnListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: this._columns,
      showSearch: true,
      typeLabel: 'column'
    });

    view.bind('selectItem', function (value) {
      this._onChangeAttribute(value, stackLayoutModel);
    }, this);

    return view;
  },

  _onChangeAttribute: function (value, stackLayoutModel) {
    this.model.set('attribute', value);

    this._column = this._getColumn();
    this._columnType = this._column && this._column.type;

    this.model.unset('fixed');
    this.model.unset('quantification');
    this.model.unset('opacity');

    if (this._columnType === 'number') {
      console.log('unsetting domain');
      this.model.unset('domain');
      stackLayoutModel.goToStep(1);
    } else if (this._columnType === 'string') {
      this.model.unset('bins');
      stackLayoutModel.goToStep(2);
    }
  }
});
