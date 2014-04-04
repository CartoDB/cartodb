/**
* Message system for the Dashboard
*
* PARAMS FOR THE NOTIFICATIONS
*
* sticky: { boolean } don't have closing link
* store:  { boolean } the status is stored in the LocalStorage
* upgrade: { boolean } show or not upgrade button
*
* HOW TO ADD NOTIFICATIONS
*
* 1) Using a predefined message (located in cdb.admin.dashboard.Messages.__MESSAGES)
*
*    cdb.admin.dashboard.Messages.addMessage(key, options);
*
*    Example:
*
*      cdb.admin.dashboard.Messages.addMessage("limits_exceeded", { username: "Santana", upgrade_url: "http://www.cartodb.com/upgrade_url" });
*
* 2) Using a custom message:
*
*    cdb.admin.dashboard.Messages.add(message, options);
*
*    Example:
*
*      cdb.admin.dashboard.Messages.add("Everything is fine!", { sticky: true });
*
* PREDEFINED MESSAGES
*
* You can add a predefined message adding a new element in the _MESSAGES hash. The structure is:
*
*   key: { template: {string}, opt1: {string | number | boolean},…, optN: {string | number | boolean} }
*
* Examples:
*
* _MESSAGES: {
*   limits_exceeded:  { template: 'Hey <strong><%= username %></strong>, looks like you\'re about to reach your account limit. Start thinking about <a href="<%= upgrade_url %>" class ="underline">upgrading your plan</a>.', sticky: true },
*   upgraded:         { template: 'Great! Welcome to your brand new <strong><%= account_type %></strong> CartoDB. Now we love you even more than before ;)', store: true },
    trial_ends_soon:  { template: 'Just a reminder, your <strong><%= account_type %></strong> trial will finish the next <%= trial_ends_at %>. Happy mapping!', sticky: true }
* }
*
* Note: to allow styling the messages the key is used as class in the MessageItem element.
*
*/

cdb.admin.dashboard.Message = cdb.core.Model.extend({
  defaults: {
    key: null,
    sticky: false,
    upgrade: false,
    trial: false,
    message: null
  }
});

cdb.admin.dashboard.MessageItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click .close": "_onClick"

  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/views/dashboard_notifications/message_item');
  },

  _onClick: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.trigger("manuallyremove", this);

  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));

    return this;

  }

});

cdb.admin.dashboard.MessageItems = Backbone.Collection.extend({
  model: "cdb.admin.dashboard.Message"
});

cdb.admin.dashboard.Messages = cdb.core.View.extend({

  tagName: "section",
  className: "warning",

  _MESSAGES: {
    try_trial:                  { store: true, sticky: false, trial: true },
    limits_exceeded:            { store: true },
    limits_tables_exceeded:     { store: true, sticky: true, upgrade: true },
    limits_space_exceeded:      { store: true, sticky: true, upgrade: true },
    limits_mapviews_exceeded:   { store: true },
    upgraded:                   { store: true },
    trial_ends_soon:            { sticky: true },
    notification:               { sticky: true }
  },

  initialize: function() {

    this.template = _.template('<ul></ul>');

    this.messages      = new cdb.admin.dashboard.MessageItems();

    this.custom_hosted = this.options.config.custom_com_hosted;

    this._setupLocalStorage();

    this.messages.bind("reset",  this.render,        this);
    this.messages.bind("add",    this._onAddMessage,    this);
    this.messages.bind("remove", this._onRemoveMessage, this);
    this.messages.bind("manuallyremove", this._onRemoveMessage, this);

    this.addView(this.messages);

    this.loadMessages();

  },

  _setupLocalStorage: function() {

    var key = this.options.localStorageKey || 'dashboard_message_' + this.options.username + '_storage';

    this.storage        = new cdb.admin.localStorage(key);
    this.closedMessages = new cdb.admin.localStorage(key + "_closed");

  },

  storeMessages: function() {

    var messages = this.messages.filter(function(message) { return message.get("store"); });

    this.storage.set(messages);

  },

  loadMessages: function() {

    var messages = _.map(this.storage.get(), function(m) {
      return new cdb.admin.dashboard.Message(m);
    });

    this.messages.reset(messages);

  },

  _isDuplicatedByKey: function(key) {
    var duplicated = this.messages.find(function(message) { 
      return message.get("key") == key; 
    });

    if (duplicated !== undefined) {
      return true;
    }

  },

  _isDuplicated: function(text) {

    var duplicated = this.messages.find(function(message) { return message.get("message") == text; });

    if (duplicated != undefined) return true;

  },

  _wasClosed: function(key) {
    return _.find(this.closedMessages.get(), function(k) { return k == key; }) ? true : false;
  },

  addMessage: function(key, data) {

    var messageData = this._MESSAGES[key];
    var messages_path = 'dashboard/views/dashboard_notifications/';
    var message = cdb.templates.getTemplate(messages_path + key)(data || {});

    if (this._isDuplicatedByKey(key)) {

      if (!this._isDuplicated(message)) {
        this.removeMessage(key);
        this.resetClosedStatus(key);

        var opt = _.extend(messageData, { key: key }, data);
        this.add(message, opt)
      }

    } else {
      var opt = _.extend(messageData, { key: key }, data);
      this.add(message, opt)
    }

  },

  removeMessage: function(key) {

    var message = this.messages.find(function(message) { return message.get("key") == key; });

    this.messages.remove(message);

  },

  add: function(text, options) {

    if (options && options.key && this._wasClosed(options.key)) return;
    if (this._isDuplicated(text)) return;

    var opt     = _.extend({ message: text }, options, { id: null });
    var message = new cdb.admin.dashboard.Message(opt);

    this.messages.push(message);

    if (opt.store) this.storeMessages();

  },

  _onAddMessage: function(model) {

    this.$el.removeClass("hidden");
    this._addMessage(model);

  },

  _onRemoveMessage: function(model) {

    var self = this;

    var className = model.get("key") || model.cid;

    var el_msg = this.$el.find("." + className);
    el_msg.slideUp(250, function() {
      el_msg.remove();
      if (self.messages.length == 0) self.$el.addClass("hidden");
    });

    this.storeMessages();

    if (model.get("store") && model.get("key") && model.get("manually")) {
      this.closedMessages.add(model.get("key"));
    }

  },

  resetClosedStatus: function(key) {

    var closed = this.closedMessages.get();
    this.closedMessages.set(_.without(closed, key));

  },

  _removeMessage: function(item) {

    if (!item.model.get("sticky")) {
      this.messages.remove(item.model);
    }

  },

  _manuallyRemoveMessage: function(item) {

    if (!item.model.get("sticky")) {
      item.model.set("manually", true);
      this.messages.remove(item.model);
    }

  },

  _addMessage: function(model) {

    var view = new cdb.admin.dashboard.MessageItem({
      className: model.get("key") || model.cid,
      model: model
    });

    view.bind("remove", this._removeMessage, this);
    view.bind("manuallyremove", this._manuallyRemoveMessage, this);

    if (this.custom_hosted) return this;

    this.$el.find("ul").append(view.render().$el);
    view.$el.slideDown(250);

  },

  render: function() {

    if (this.custom_hosted) return this;

    this.$el.empty();
    this.$el.append(this.template);

    this.messages.each(this._addMessage, this);

    if (this.messages.length == 0) this.$el.addClass("hidden");
    else this.$el.removeClass("hidden");

    return this;

  }

});

