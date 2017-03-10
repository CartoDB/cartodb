var $ = require('jquery');
var moment = require('moment');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./publish-button.tpl');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'mapcapsCollection',
  'configModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_onUpdate'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.model = new Backbone.Model({
      status: 'idle'
    });

    this._initBinds();
  },

  render: function () {
    var publishedOn = this._mapcapsCollection.length > 0
                    ? _t('components.modals.publish.share.last-published', { date:
                        this.model.get('status') === 'updated'
                        ? moment(this._mapcapsCollection.first().get('created_at')).fromNow()
                        : moment(this._mapcapsCollection.first().get('created_at')).format('Do MMMM YYYY, HH:mm')
                      })
                    : _t('components.modals.publish.share.unpublished');

    this.clearSubViews();
    this.$el.html(template({
      isPublished: this._mapcapsCollection.length > 0,
      isLoading: this._isLoading(),
      isDisabled: this._isDisabled(),
      publishedOn: publishedOn
    }));
    return this;
  },

  _initBinds: function () {
    this._mapcapsCollection.on('reset', this.render, this);
    this.add_related_model(this._mapcapsCollection);
    this.model.on('change:status', this.render, this);
  },

  _isLoading: function () {
    return this.model.get('status') === 'loading';
  },

  _isDisabled: function () {
    return this.model.get('status') === 'updated';
  },

  _onUpdate: function () {
    var self = this;
    var url = this._visDefinitionModel.mapcapsURL();
    var data = {
      api_key: this._configModel.get('api_key')
    };

    if (this._isDisabled()) return false;

    self.model.set({status: 'loading'});

    $.post(url, data)
    .done(function (data) {
      self._visDefinitionModel.set('visChanges', 0);
      self._mapcapsCollection.add(data, {at: 0});
      self.model.set({status: 'updated'});
    })
    .fail(function () {
      self.model.set({status: 'error'});
    });
  }
});
