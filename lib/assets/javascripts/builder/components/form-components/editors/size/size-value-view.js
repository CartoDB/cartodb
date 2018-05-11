var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

var DialogModel = require('builder/components/form-components/editors/style-common/dialog-model');
var DialogView = require('builder/components/form-components/editors/style-common/dialog-view');

var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ColumnListView = require('builder/components/form-components/editors/style-common/column-list-view');
var quantificationMethodItemTemplate = require('builder/components/form-components/editors/style-common/quantification-method-item.tpl');
var SizeValueContentView = require('./size-value-content-view');

var PopupManager = require('builder/components/popup-manager');
var DefaultSettings = require('./size-default-settings.json');

/**
 * add the number of classes
 * change the max depending on the min
 * smaller values on top
 */
var COLUMN_PANE_INDEX = 0;
var MAIN_PANE_INDEX = 1;
var QUANTIFICATION_PANE_INDEX = 2;

module.exports = CoreView.extend({
  className: 'Editor-formInner',

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');

    this._columns = opts.columns;
    this._settings = DefaultSettings;

    this._setupModel();
    this._initBinds();
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
      var quantifications = this._settings.quantifications;
      options.quantification =
        quantifications.items[quantifications.defaultIndex];
    }

    var modelBins = this.model.get('bins');
    var defaultBins = this._settings.bins;

    if (!modelBins) {
      options.bins = defaultBins.items[defaultBins.defaultIndex];
    }

    if (+modelBins > +_.last(defaultBins.items)) {
      options.bins = _.last(defaultBins.items);
    }

    this.model.set(options);
  },

  _initViews: function () {
    this._initDialog();
    this._initInputColumn();
    // this._initStackView();

    this._popupManager = new PopupManager(
      this.cid,
      this.$el,
      this._dialogView.$el
    );
  },

  _initDialog: function () {
    var dialogModel = new DialogModel();

    this.listenToOnce(dialogModel, 'destroy', function () {
      this._dialogView = null;
      this.stopListening(dialogModel);
    });

    this._dialogView = new DialogView({
      model: dialogModel
    });
  },

  _initInputColumn: function () {
    this._inputColumn = new Backbone.Form.editors.Text({
      schema: {},
      editorAttrs: { placeholder: _t('form-components.editors.style.select-column') }
    });
    this.$el.append(this._inputColumn.render().$el);
  },

  _removeDialog: function (dialog) {
    this._dialogView.clean();
    this._popupManager.untrack();
  },

  _initStackView: function () {
    var stackViewCollection = new Backbone.Collection([
      { createStackView: this._createInputRampContentView.bind(this) },
      { createStackView: this._createSizeValueContentView.bind(this) },
      { createStackView: this._createQuantificationListView.bind(this) },
      { createStackView: this._createBinsListView.bind(this) }
    ]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this._stackLayoutView.model.set('position', this._getCurrentStepPosition());

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);

    this._stackLayoutView.show();
  },

  _initBinds: function () {
    // TODO: functions available at form.editor
    // this.applyESCBind(function () {
    //   this._removeDialog();
    // });
    // this.applyClickOutsideBind(function () {
    //   this._removeDialog();
    // });
  },

  _onInputClick: function (inputModel) {
    if (inputModel.get('selected')) {
      this._removeDialog();
      return;
    }

    inputModel.set('selected', true);
    this._dialogView.model.set(
      'createContentView',
      inputModel.get('createContentView')
    );
    this._dialogView.render();
    this._dialogView.show();

    this._popupManager.append(this.dialogMode);
    this._popupManager.track();
  },

  _getCurrentStepPosition: function () {
    var position = MAIN_PANE_INDEX;
    if (!this.model.get('attribute')) {
      position = COLUMN_PANE_INDEX;
    } else if (!this.model.get('quantification')) {
      position = QUANTIFICATION_PANE_INDEX;
    }
    return position;
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

    view.bind(
      'selectItem',
      function (item) {
        this.model.set('attribute', item.get('val'));
        var step = MAIN_PANE_INDEX;
        if (!this.model.get('quantification')) {
          step = QUANTIFICATION_PANE_INDEX;
        }
        this._stackLayoutView.model.goToStep(step);
      },
      this
    );

    return view;
  },

  _createSizeValueContentView: function (stackLayoutModel, opts) {
    var view = new SizeValueContentView({
      stackLayoutModel: stackLayoutModel,
      model: this.model,
      min: this.options.min,
      max: this.options.max
    });

    view.bind(
      'back',
      function (value) {
        stackLayoutModel.prevStep();
      },
      this
    );

    view.bind(
      'selectQuantification',
      function (value) {
        stackLayoutModel.goToStep(2);
      },
      this
    );

    view.bind(
      'selectBins',
      function (value) {
        stackLayoutModel.goToStep(3);
      },
      this
    );

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

    view.bind(
      'selectItem',
      function (item) {
        this.model.set('quantification', item.get('val'));
        stackLayoutModel.prevStep();
      },
      this
    );

    view.bind(
      'back',
      function (value) {
        stackLayoutModel.prevStep();
      },
      this
    );

    return view;
  },

  _createBinsListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.bins'),
      stackLayoutModel: stackLayoutModel,
      columns: this._settings.bins.items
    });

    view.bind(
      'selectItem',
      function (item) {
        this.model.set('bins', item.get('val'));
        stackLayoutModel.goToStep(1);
      },
      this
    );

    view.bind(
      'back',
      function (value) {
        stackLayoutModel.goToStep(1);
      },
      this
    );

    return view;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  },

  remove: function () {
    console.log('remove');
    this._removeDialog();
    this.$el.remove();
    this._popupManager.destroy();
  }
});
