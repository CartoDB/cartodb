var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var StartView = require('./start_view');
var ShareView = require('./share_view');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');
var ChangePrivacyModel = require('./view_model');

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
    this.model = new ChangePrivacyModel({
      vis: this.options.vis, //vis
      user: this.options.user
    });

    this.add_related_model(this.model);

    this._startView = new StartView({ viewModel: this.model });
    this.addView(this._startView);

    if (this.model.canShare()) {
      this._shareView = new ShareView({ viewModel: this.model });
      this.addView(this._shareView);
    }

    this.model.bind('change:state', function() {
      if (this.model.get('state') === 'SaveDone') {
        this.close();
      } else {
        this.render();
        var methodName = this.model.shouldRenderDialogWithExpandedLayout() ? 'addClass' : 'removeClass';
        this.$('.content')[ methodName ]('Dialog-content--expanded');
      }
    }, this);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this['_render' + this.model.get('state')]();
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
      title: this.model.get('vis').get('name') + ' privacy',
      showBackButton: false
    }

    if (this.model.get('state') === 'Share') {
      d.subtitle = 'Select your colleagues you want to give access in the list below';
      d.showBackButton = true;
    } else {
      var type = this.model.get('vis').isVisualization() ? 'map' : 'dataset';
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
    this.model.changeState('Start');
  }
});
