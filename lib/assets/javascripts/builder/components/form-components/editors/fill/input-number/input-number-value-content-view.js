var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ColumnListView = require('builder/components/form-components/editors/fill/column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputNumberContentView = require('./input-number-content-view');
var DefaultFillSettings = require('builder/components/form-components/editors/fill/default-fill-settings.json');

/**
 * add the number of classes
 * change the max depending on the min
 * smaller values on top
 */
var COLUMN_PANE_INDEX = 0;
var MAIN_PAIN_INDEX = 1;
var QUANTIFICATION_PANE_INDEX = 2;

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    this._columns = opts.columns;

    this._settings = DefaultFillSettings.number;

    this._setupModel();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _setupModel: function () {
    var options = {};

    if (!this.model.get('quantification')) {
      options.quantification = this._settings.quantifications.items[this._settings.quantifications.defaultIndex];
    }

    if (!this.model.get('bins')) {
      options.bins = this._settings.bins.items[this._settings.bins.defaultIndex];
    }

    if (+this.model.get('bins') > +this._settings.bins.items[this._settings.bins.items.length - 1]) {
      options.bins = this._settings.bins.items[this._settings.bins.items.length - 1];
    }

    this.model.set(options);
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputRampContentView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputNumberContentView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createQuantificationListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createBinsListView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    var position = MAIN_PAIN_INDEX;

    if (!this.model.get('attribute')) {
      position = COLUMN_PANE_INDEX;
    } else if (!this.model.get('quantification')) {
      position = QUANTIFICATION_PANE_INDEX;
    }

    this._stackLayoutView.model.set('position', position);
    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);
  },

  _createInputRampContentView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: this._columns.filter(function (f) {
        return f.type === 'number';
      }),
      showSearch: true,
      typeLabel: 'column'
    });

    view.bind('selectItem', function (item) {
      this.model.set('attribute', item.get('val'));
      var step = MAIN_PAIN_INDEX;
      if (!this.model.get('quantification')) {
        step = QUANTIFICATION_PANE_INDEX;
      }
      this._stackLayoutView.model.goToStep(step);
    }, this);

    return view;
  },

  _createInputNumberContentView: function (stackLayoutModel, opts) {
    var view = new InputNumberContentView({
      stackLayoutModel: stackLayoutModel,
      model: this.model,
      min: this.options.min,
      max: this.options.max
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectQuantification', function (value) {
      stackLayoutModel.goToStep(2);
    }, this);

    view.bind('selectBins', function (value) {
      stackLayoutModel.goToStep(3);
    }, this);

    return view;
  },

  _createQuantificationListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.quantification.title'),
      stackLayoutModel: stackLayoutModel,
      columns: this._settings.quantifications.items,
      itemTemplate: quantificationMethodItemTemplate,
      showSearch: false
    });

    view.bind('selectItem', function (item) {
      this.model.set('quantification', item.get('val'));
      stackLayoutModel.prevStep();
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    return view;
  },

  _createBinsListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.bins'),
      stackLayoutModel: stackLayoutModel,
      columns: this._settings.bins.items
    });

    view.bind('selectItem', function (item) {
      this.model.set('bins', item.get('val'));
      stackLayoutModel.goToStep(1);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(1);
    }, this);

    return view;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});
