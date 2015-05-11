var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var StartView = require('./start_view');
var ShareView = require('./share_view');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-back': '_goBack'
    });
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.options.viewModel) {
      throw new Error('viewModel is compulsory');
    }
    this._viewModel = this.options.viewModel;
    this.add_related_model(this._viewModel);

    this._startView = new StartView({ viewModel: this._viewModel });
    this.addView(this._startView);

    if (this._viewModel.canShare()) {
      this._shareView = new ShareView({ viewModel: this._viewModel });
      this.addView(this._shareView);
    }

    this._viewModel.bind('change:state', function() {
      if (this._viewModel.get('state') === 'SaveDone') {
        this.close();
      } else {
        this.render();
        var methodName = this._viewModel.shouldRenderDialogWithExpandedLayout() ? 'addClass' : 'removeClass';
        this.$('.content')[ methodName ]('Dialog-content--expanded');
      }
    }, this);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this['_render' + this._viewModel.get('state')]();
  },

  cancel: function() {
    this.clean();
  },

  _renderStart: function() {
    return this._getRenderedElements('_startView');
  },

  _renderShare: function() {
    return this._getRenderedElements('_shareView');
  },

  _getRenderedElements: function(varViewName) {
    var view = this[varViewName];
    view.render();
    view.delegateEvents(); // reset events since they seem to get undelegated on changes

    return [
      this._headerContentEl(),
      view.el
    ];
  },

  _headerContentEl: function() {
    var d = {
      title: this._viewModel.get('vis').get('name') + ' privacy',
      showBackButton: false
    }

    if (this._viewModel.get('state') === 'Share') {
      d.subtitle = 'Select your colleagues you want to give access in the list below';
      d.showBackButton = true;
    } else {
      var type = this._viewModel.get('vis').isVisualization() ? 'map' : 'dataset';
      d.subtitle = 'Although we believe in the power of open data, you can also protect your ' + type;
    }

    return $( cdb.templates.getTemplate('new_common/dialogs/change_privacy/header_template')(d) )[0];
  },

  _renderSaving: function() {
    return cdb.templates.getTemplate('new_common/templates/loading')({
      title: 'Saving privacy...',
      quote: randomQuote()
    });
  },

  _renderSaveFail: function() {
    return cdb.templates.getTemplate('new_common/templates/fail')({
      msg: ''
    });
  },

  _goBack: function(ev) {
    this.killEvent(ev);
    this._viewModel.changeState('Start');
  }
});
