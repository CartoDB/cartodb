var _ = require('underscore');
var $ = require('jquery');
var BaseDialog = require('../../views/base_dialog/view.js');
var MergeDatasetsModel = require('./merge_datasets_model.js');
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

  events: BaseDialog.extendEvents({
    'click .js-next:not(.is-disabled)': '_onNextClick',
    'click .js-back': '_onBackClick'
  }),

  initialize: function() {
    this.options.clean_on_hide = true;
    this.options.enter_to_confirm = false;
    this.elder('initialize');

    this.model = new MergeDatasetsModel({
      table: this.options.table,
      user: this.options.user
    });

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
    var $el;
    var defaultTemplate = this.getTemplate('common/dialogs/merge_datasets/merge_datasets_content');

    var currentStep = this.model.get('currentStep');
    if (currentStep) {
      var $step = this._$renderedStep(currentStep);
      if (currentStep.get('skipDefaultTemplate')) {
        // Render the view as content w/o wrapping it in the default template
        return $step;
      }

      $el = $(defaultTemplate({
        currentStep: currentStep,
        isReadyForNextStep: currentStep.get('isReadyForNextStep'),
        headerSteps: this.model.headerSteps(),
        nextLabel: this.model.isLastHeaderStep() ? this._TEXTS.merge : this._TEXTS.next
      }));
      $el.find('.js-details').append($step);
    } else {
      $el = $(defaultTemplate({
        currentStep: undefined
      }));
      var $mergeFlavorsList = $el.find('.js-flavors');
      $mergeFlavorsList.append.apply($mergeFlavorsList, this._$renderedMergeFlavors());
    }

    return $el;
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

  _onChangeSelectedMergeFlavor: function(model, wasSelected) {
    // Only change to next step if there's one selected
    if (wasSelected) {
      // reset selected state, so if/when user goes back to start view can select again
      model.unset('selected');

      // Set new current step
      var firstStep = model.firstStep();
      this.model.set('currentStep', firstStep);

      // Equal to step 1 in old dialog, track stats
      // TODO: remove mixpanel
      cdb.god.trigger('mixpanel', 'Use visual merge');

      // Event tracking "Use visual merge"
      cdb.god.trigger('metrics', 'visual_merge', {
        email: window.user_data.email
      });
    }
  },

  _initBinds: function() {
    this.model.bind('change:currentStep', this.render, this);
    this.model.get('mergeFlavors').bind('change:selected', this._onChangeSelectedMergeFlavor, this);
  },

  _onChangeIsReadyForNextStep: function(model, isReady) {
    this.$('.js-next').toggleClass('is-disabled', !isReady);
  },

  _onChangeGoDirectlyToNextStep: function(model, isTrue) {
    if (isTrue) {
      this.model.gotoNextStep();
    }
  },

  _$renderedStep: function(step) {
    // Clean up prev step, if there is any
    if (this._stepView) {
      this._stepView.clean();
      this.removeView(this._stepView);

      this._stepModel.unbind('change:isReadyForNextStep');
      this._stepModel.unbind('change:goDirectlyToNextStep');
      this._models = _.without(this._models, this._stepModel); // TODO: why no this.remove_related_model?
    }

    this._stepModel = step;
    this._stepModel.bind('change:isReadyForNextStep', this._onChangeIsReadyForNextStep, this);
    this._stepModel.bind('change:goDirectlyToNextStep', this._onChangeGoDirectlyToNextStep, this);
    this.add_related_model(this._stepModel);

    this._stepView = step.createView();
    this.addView(this._stepView);
    return this._stepView.render().$el;
  },

  _onNextClick: function(e) {
    this.killEvent(e);
    this.model.gotoNextStep();
  },

  _onBackClick: function(e) {
    this.killEvent(e);
    this.model.gotoPrevStep();
  }
});
