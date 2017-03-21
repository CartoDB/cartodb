var $ = require('jquery');
var moment = require('moment');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var checkAndBuildOpts = require('../../../cartodb3/helpers/required-opts');

var REQUIRED_OPTS = [
  '$form'
];

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_onUpdate'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.template = cdb.templates.getTemplate('organization/organization_notification/send_button');

    this.model = new Backbone.Model({
      status: 'idle'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this.template({
      isLoading: this._isLoading(),
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:status', this.render);
  },

  _isLoading: function () {
    return this.model.get('status') === 'loading';
  },

  _onUpdate: function () {
    this.model.set({status: 'loading'});

    this._$form.submit();
  }
});
