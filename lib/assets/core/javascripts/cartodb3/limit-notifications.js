var Backbone = require('backbone');
var _ = require('underscore');
var Infobox = require('./components/infobox/infobox-factory');

var LimitNotificationsCollection = Backbone.Collection.extend({
  model: function (attrs, opts) {
    return new Backbone.Model(attrs, opts);
  },

  findById: function (id) {
    return this.findWhere({ id: id });
  },

  findByType: function (type) {
    return this.findWhere({ type: type });
  }
});

var LimitNotifications = (function () {
  var initialized = false; // eslint-disable-line
  var collection = new LimitNotificationsCollection();
  var configModel;

  function init (opts) {
    initialized = true;

    if (!opts && !opts.configModel) {
      throw new Error('configModel is required');
    }

    configModel = opts.configModel;
  }

  return {
    init: function (opts) {
      init(opts);
    },

    // For testing porposes only
    off: function () {
      if (__ENV__ === 'test') {
        collection.reset();
        initialized = false;
      }
    },

    getByType: function (type) {
      return collection.findByType(type);
    },

    getCollection: function () {
      return collection;
    },

    getNotification: function (model) {
      return collection.get(model);
    },

    addNotification: function (attrs) {
      var notification = this.getByType(attrs.type);
      return notification || collection.add(attrs);
    },

    removeNotification: function (model) {
      var notification = this.getNotification(model);
      return collection.remove(notification);
    },

    infobox: function () {
      var infoboxOpts = {
        type: 'alert',
        title: _t('editor.messages.limit.title'),
        body: _t('editor.messages.limit.body')
      };

      var baseState = {
        state: 'limit'
      };

      if (!configModel.isHosted()) {
        baseState.secondAction = function () {
          window.open(_t('editor.messages.limit.cta.url'));
        };
        infoboxOpts.secondAction = {
          label: _t('editor.messages.limit.cta.label'),
          type: 'secondary'
        };
        infoboxOpts.body = _t('editor.messages.limit.body') + _t('editor.messages.limit.try_to');
      }

      return _.extend(baseState, {
        createContentView: function () {
          return Infobox.createWithAction(infoboxOpts);
        }
      });
    }
  };
})();

module.exports = LimitNotifications;
