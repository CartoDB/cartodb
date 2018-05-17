var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

var template = require('./size-value-view.tpl');
var DialogModel = require('builder/components/form-components/editors/style-common/dialog-model');
var DialogView = require('builder/components/form-components/editors/style-common/dialog-view');

var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ColumnListView = require('builder/components/custom-list/column-list/column-list-view');
var quantificationMethodItemTemplate = require('builder/components/form-components/editors/style-common/quantification-method-item.tpl');
var SizeValueContentView = require('./size-value-content-view');

var PopupManager = require('builder/components/popup-manager');
var DefaultSettings = require('./size-default-settings.json');

var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = ['columns', 'popupConfig'];

var COLUMN_PANE_INDEX = 0;
var MAIN_PANE_INDEX = 1;
var QUANTIFICATION_PANE_INDEX = 2;

module.exports = CoreView.extend({
  className: 'Form-StyleByValue u-ellipsis',

  events: {
    'click .js-button': '_onButtonClick',
    'click .js-back': '_onClickBack'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._settings = DefaultSettings;
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
    this.listenTo(this.model, 'change:attribute', this.render);
  },

  _initViews: function () {
    this._initDialog();
    this._initInputColumn();

    this._popupManager = new PopupManager(
      this._popupConfig.cid,
      this._popupConfig.$el,
      this._dialogView.$el
    );
  },

  _initDialog: function () {
    if (this._dialogView) return;

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
    var label = this.model.get('attribute') || _t('form-components.editors.style.select-column');
    this.$el.append(template({
      label: label
    }));
  },

  removeDialog: function () {
    this._dialogView.clean();
    this._popupManager.untrack();
  },

  removePopupManager: function () {
    this._popupManager.destroy();
  },

  _createStackView: function () {
    var stackLayoutView = new StackLayoutView({
      collection: new Backbone.Collection([
        { createStackView: this._createColumnsView.bind(this) },
        { createStackView: this._createSizeValueContentView.bind(this) },
        { createStackView: this._createQuantificationView.bind(this) },
        { createStackView: this._createBinsView.bind(this) }
      ])
    });
    stackLayoutView.model.set('position', this._getDialogStepPosition());
    return stackLayoutView;
  },

  _onButtonClick: function () {
    this._dialogView.model.set('createContentView', this._createStackView.bind(this));
    this._dialogView.render();
    this._dialogView.show();

    this._popupManager.append('float');
    this._popupManager.track();
  },

  _getDialogStepPosition: function () {
    var position = MAIN_PANE_INDEX;
    if (!this.model.get('attribute')) {
      position = COLUMN_PANE_INDEX;
    } else if (!this.model.get('quantification')) {
      position = QUANTIFICATION_PANE_INDEX;
    }
    return position;
  },

  _createColumnsView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: this._columns.filter(function (column) {
        return column.type === 'number';
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
        stackLayoutModel.goToStep(step);
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

  _createQuantificationView: function (stackLayoutModel, opts) {
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

  _createBinsView: function (stackLayoutModel, opts) {
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
  }
});
