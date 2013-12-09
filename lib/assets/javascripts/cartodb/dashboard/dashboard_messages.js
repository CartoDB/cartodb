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
    message: null
  }
});

cdb.admin.dashboard.MessageItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click .close": "_onClick"

  },

  initialize: function() {
    this.template = _.template('<div class="inner"><p><%= message%></p><% if (!sticky) {%><a href="#/close" class="smaller close">x</a><% } %><% if (upgrade) {%><a class="button small green upgrade" href="<%= upgrade_url %>?utm_source=Dashboard_Limits_Reached&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=Upgrade%20now%20%28button%29">Upgrade now</a><% } %></div>');
  },

  _onClick: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.trigger("manuallyremove", this);

  },

  render: function() {
    console.log(this.model.toJSON());
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
    limits_exceeded:            { template: 'Hey <strong><%= username %></strong>, looks like you\'re about to reach your account limit. Start thinking about <a href="<%= upgrade_url %>?utm_source=Dashboard_Limits_Nearing&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class ="underline">upgrading your plan</a>.', store: true },
    limits_tables_exceeded:     { template: 'Hey <strong><%= username %></strong>, you\'re over your table limits. Start thinking about <a href="<%= upgrade_url %>?utm_source=Dashboard_Limits_Reached&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class ="underline">upgrading your plan</a>.', store: true, sticky: true, upgrade: true },
    limits_space_exceeded:      { template: 'Hey <strong><%= username %></strong>, you\'re over your disk limits. Start thinking about <a href="<%= upgrade_url %>?utm_source=Dashboard_Limits_Reached&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class ="underline">upgrading your plan</a>.', store: true, sticky: true, upgrade: true },
    limits_mapviews_exceeded:   {
      template: '<% if (account_type == "FREE") { %>Your map views for the month are over limit. Your billing month restarts on <%= moment(billing_period).format("YYYY-MM-DD") %>. Please add your billing info as soon as possible to avoid a stop in your service. For all FREE accounts, map views over the first 50,000 cost $0.20 per 1000. If you need help or have questions, <a href="mailto:support@cartodb.com">contact us</a>.<% } else { %>Hey <strong><%= username %></strong>, you\'re over your map view limit, your current overage quota is $<%= mapviews_overage_quota %> for every 1000 extra requests.<br />Start thinking about <a href="<%= upgrade_url %>?utm_source=Dashboard_Limits_Reached&utm_medium=referral&utm_campaign= Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class="underline">upgrading your plan</a>.<% } %>',
      store: true
    },
    upgraded:                   { template: 'Great! Welcome to your brand new <strong><%= account_type %></strong> CartoDB. Now we love you even more than before ;)', store: true },
    trial_ends_soon:            { template: 'Just a reminder, your <strong><%= account_type %></strong> trial will finish the next <%= moment(trial_ends_at).format("YYYY-MM-DD") %>. Happy mapping!', sticky: true },
    notification:               { template: '<%= notification %>', sticky: true }
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

    var duplicated = this.messages.find(function(message) { return message.get("key") == key; });

    if (duplicated != undefined) return true;

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
    var message;

    if (data) {
      message = _.template(messageData.template, data);
    } else {
      message = _.template(messageData.template);
    }

    if (this._isDuplicatedByKey(key)) {

      if (!this._isDuplicated(message)) {
        this.removeMessage(key);
        this.resetClosedStatus(key);

        var opt = _.extend(messageData, { key: key });
        this.add(message, opt)
      }

    } else {
      var opt = _.extend(messageData, { key: key });
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

    var opt     = _.extend({ message: text }, options);
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

    this.$el.find("." + className).slideUp(250, function() {
      this.remove();
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

