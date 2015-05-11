
/**
 *  Default pane for url imports
 *
 *  - It needs a user model.
 *
 *  new cdb.admin.ImportUrlPane({
 *    user: user_model
 *  })
 */

cdb.admin.ImportUrlPane = cdb.admin.ImportPane.extend({
    
  className: "import-pane import-url-pane",

  events: {
    'focusin input.url-input':  '_onInputFocusIn',
    'focusout input.url-input': '_onInputFocusOut',
    'submit form':              '_onSubmitForm',
    'keyup input':              '_onInputChange',
    'keydown input':            '_onInputChange'
  },

  _TEXTS: {
    urlError: _t("There is an error in the URL you've inserted. Please recheck.")
  },

  initialize: function() {
    this.user = this.options.user;

    if (!this.options.service_name || !this.options.type) {
      throw new TypeError('Missing type or service name for import URL pane');
    }
    
    this.model = new cdb.core.Model({
      type:             this.options.type,
      value:            '',
      interval:         '0',
      service_name:     this.options.service_name,
      service_item_id:  '',
      valid:            false
    });

    if (!this.options.template) {
      throw new TypeError('Missing template for import URL pane');
    } else {
      this.template = cdb.templates.getTemplate(this.options.template);
    }

    this.render();

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.append( this.template() );

    this._initViews();

    return this;
  },

  _initViews: function() {
    // It will show errors, sync, user,... etc
    this.import_info = new cdb.admin.ImportInfo({
      el:         this.$('div.infobox'),
      model:      this.model,
      acceptSync: this.options.acceptSync || this.user.get('actions').sync_tables
    });
    
    this.addView(this.import_info);
  },

  _initBinds: function() {
    _.bindAll(this, '_onInputChange', '_onSubmitForm', '_onInputFocusIn', '_onInputFocusOut');
    this.model.bind('change:value change:interval', this._onValueChange, this);
  },

  _onInputChange: function(e) {
    var value = $(e.target).val();

    // If user press ENTER, submit!
    if (e.which === 13) {
      this._onSubmitForm();
      return false;
    }

    this.model.set({
      value:            value,
      service_item_id:  value,
      valid:            this._checkValid(value)
    });

    this._triggerAction('valueChange', value);
  },

  _onInputFocusIn: function() {
    this.$("div.upload").addClass("active");
  },

  _onInputFocusOut: function() {
    this.$("div.upload").removeClass("active");
  },

  _onSubmitForm: function(e) {
    if (e) this.killEvent(e);

    if (this.model.get('valid')) {
      this._triggerAction('fileChosen', this.model.attributes);
    } else {
      this.import_info.activeTab('error', this._TEXTS.urlError);
    }

    return false;
  },

  _onValueChange: function() {
    this._triggerAction('valueChange', this.model.get('value'));
  },

  _triggerAction: function(eventName, params) {
    this.trigger(eventName, params, this);
  },

  _checkValid: function(str) {
    return cdb.Utils.isURL(str);
  }

});