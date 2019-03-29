const CoreView = require('backbone/core-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const loadingView = require('builder/components/loading/render-loading');
const failTemplate = require('dashboard/components/fail.tpl');
const template = require('./change-lock.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'modalModel'
];

/**
 * Lock/unlock datasets/maps dialog.
 */
module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_ok',
    'click .js-cancel': 'close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.listenTo(this.model, 'change', function () {
      if (this.model.get('state') === 'ProcessItemsDone') {
        this.close();
      } else {
        this.render();
      }
    });
  },

  render: function () {
    this.$el.html(this['_render' + this.model.get('state')]());
  },

  _renderConfirmChangeLock: function () {
    // An entity can be an User or Organization
    const itemsCount = this.model.get('items').length;
    const areLocked = this.model.get('initialLockValue');
    const viewTemplate = this.options.template || template;

    return viewTemplate({
      model: this.model,
      itemsCount: itemsCount,
      ownerName: this.options.ownerName,
      isOwner: this.options.isOwner,
      thisOrTheseStr: itemsCount === 1 ? 'this' : 'these',
      itOrThemStr: itemsCount === 1 ? 'it' : 'them',
      areLocked: areLocked,
      positiveOrNegativeStr: areLocked ? 'positive' : 'alert',
      lockOrUnlockStr: areLocked ? 'unlock' : 'lock',
      contentTypePluralized: pluralizeString(
        this.model.get('contentType') === 'datasets' ? 'dataset' : 'map', // singular
        this.model.get('contentType'), // plural
        itemsCount
      )
    });
  },

  _ok: function (e) {
    this.killEvent(e);
    this.model.inverseLock();
    this.render();
  },

  close: function () {
    this._modalModel.destroy();
  },

  _renderProcessingItems: function () {
    const lockingOrUnlockingStr = this.model.get('initialLockValue') ? 'Unlocking' : 'Locking';
    return loadingView({
      title: `${lockingOrUnlockingStr} ${pluralizeString(this.model.get('contentType') === 'datasets' ? 'dataset' : 'map', this.model.get('items').length)}…`
    });
  },

  _renderProcessItemsFail: function () {
    var lockingOrUnlockingStr = this.model.get('initialLockValue') ? 'unlock' : 'lock';

    return failTemplate({
      msg: 'Failed to ' + lockingOrUnlockingStr + ' all items'
    });
  }
});
