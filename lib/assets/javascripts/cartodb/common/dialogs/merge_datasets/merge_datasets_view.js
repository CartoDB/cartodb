var _ = require('underscore');
var $ = require('jquery');
var BaseDialog = require('../../views/base_dialog/view.js');
var MergeDatasetsModel = require('./merge_datasets_model.js');
var ViewFactory = require('../../view_factory.js');
var randomQuote = require('../../view_helpers/random_quote.js');
var ErrorDetailsView = require('../../views/error_details_view');
var MergeFlavorView = require('./merge_flavor_view');

/**
* Shows a dialog to start merging two tables
*  new MergeDatasetsDialog({
*    model: table
*  })
* Migrated from old code.
*/
module.exports = BaseDialog.extend({

  _TEXTS: {
    next: 'Next step',
    merge: 'Merge datasets'
  },

  events: function(){
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-next:not(.is-disabled)': '_onNextClick',
      'click .js-back': '_onBackClick'
    });
  },

  initialize: function() {
    _.bindAll(this, '_onMergeError');

    this.options.clean_on_hide = true;
    this.elder('initialize');

    this.model = new MergeDatasetsModel({
      table: this.options.table
    });

    // Required for error details view below
    this.user = this.options.user;

    this._initBinds();
  },

  /**
   * @override BaseDialog.prototype.render
   */
  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this.$('.content').addClass('Dialog-contentWrapper');
    return this;
  },

  render_content: function() {
    this.clearSubViews();
    var isReadyForNextStep;
    var currentStep = this.model.get('currentStep');
    if (currentStep) {
      currentStep.reset();
      currentStep.bind('change:isReadyForNextStep', this._onChangeIsReadyForNextStep, this);
      isReadyForNextStep = currentStep.get('isReadyForNextStep');
      this.add_related_model(currentStep);
    }

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/merge_datasets_content')({
        currentStep: currentStep,
        allSteps: this.model.allSteps(),
        isReadyForNextStep: isReadyForNextStep,
        nextLabel: this.model.isLastStep() ? this._TEXTS.merge : this._TEXTS.next
      })
    );

    if (currentStep) {
      var v = currentStep.createView();
      $el.find('.js-details').append(v.render().$el);
      this.addView(v);
    } else {
      var $mergeFlavorsList = $el.find('.js-flavors');
      $mergeFlavorsList.append.apply($mergeFlavorsList, this._$renderedMergeFlavors());
    }

    return $el;
  },

  _initBinds: function() {
    // TODO: bind to know when canGotoNextStep
    this.model.bind('change:currentStep', this.render, this);
    this.model.get('mergeFlavors').bind('change:selected', this._onChangeSelectedMergeFlavor, this);
  },

  _onChangeIsReadyForNextStep: function(model, isReady) {
    this.$('.js-next').toggleClass('is-disabled', !isReady);
  },

  _onChangeSelectedMergeFlavor: function(model, wasSelected) {
    // Only change to next step if there's one selected
    if (wasSelected) {
      // reset selected state silently, so if/when user goes back to start view can select again
      model.unset('selected');

      // Set new current step
      var firstStep = model.firstStep();
      this.model.set('currentStep', firstStep);
    }
  },

  _$renderedMergeFlavors: function() {
    return this.model.get('mergeFlavors')
      .map(function(model) {
        var view = new MergeFlavorView({
          model: model
        });
        this.addView(view);
        return view.render().$el;
      }, this);
  },

  _onNextClick: function(e) {
    this.killEvent(e);

    this.model.get('currentStep').unbind('change:isReadyForNextStep');

    if (this.model.isLastStep()) {
      this._showLoader();
      this.model.merge({
        error: this._onMergeError
      });
    } else {
      this.model.gotoNextStep();
    }
  },

  _onBackClick: function(e) {
    this.killEvent(e);
    this.model.gotoPrevStep();
  },

  _showLoader: function() {
    this._loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Merging datasets and generating the new one…',
      quote: randomQuote()
    });
    this.addView(this._loadingView);
    this._loadingView.appendToBody();
  },

  _onMergeError: function(e) {
    try {
      this._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
    } catch(e) {
      this._showError('99999', 'Unknown', '');
    }
  },

  //Show the error when duplication fails
  _showError: function(number, description, wadus) {
    this.hide(); // effectivately removes loading dialog too since added a subview

    // Add data
    var dialog = ViewFactory.createDialogByView(
      new ErrorDetailsView({
        err: {
          error_code: number,
          title: description,
          what_about: wadus
        },
        user: this.user
      })
    );
    dialog.appendToBody();
  },

  _ok: function() {}
});
