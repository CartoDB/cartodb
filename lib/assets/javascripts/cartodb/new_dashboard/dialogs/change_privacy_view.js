var cdb = require('cartodb.js');
var $ = require('jquery');
var BaseDialog = require('../../new_common/views/base_dialog/view');
var StartView = require('./change_privacy/start_view');
var ShareView = require('./change_privacy/share_view');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

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
    return $(
      cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/header_template')({
        itemName: this._viewModel.get('vis').get('name'),
        itemType: this._viewModel.get('vis').isVisualization() ? 'map' : 'datasets'
      })
    )[0];
  },

  _renderSaving: function() {
    return cdb.templates.getTemplate('new_dashboard/templates/loading')({
      title: 'Saving privacy...'
    });
  },

  _renderSaveFail: function() {
    return cdb.templates.getTemplate('new_dashboard/templates/fail')({
      msg: ''
    });
  }
});
