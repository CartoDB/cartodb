
  /**
   *
   *  Setting password for any model
   *
   *  - Needs a model to set a password
   *  - Needs the model attribute to set the password
   *
   *  new cdb.admin.PrivacyPassword({ vis: vis_model, attribute: 'password' })
   *
   */

  
  cdb.admin.PrivacyPassword = cdb.core.View.extend({

    _DEFAULT_VALUE: 'FAKE123',

    className:  'privacy-password',
    tagName:    'div',

    events: {
      'focusin input.password':   '_onInputFocusIn',
      'focusout input.password':  '_onInputFocusOut',
      'click input.submit':       '_onFormSubmit',
      'submit form':              '_onFormSubmit'
    },

    initialize: function() {
      _.bindAll(this, '_onFormSubmit');
      this.template = cdb.templates.getTemplate('table/views/privacy_dialog/privacy_password');
      this.model = new cdb.core.Model({ statue: 'idle' });
      this.vis = this.options.vis;
      this.model_attribute = this.options.attribute;
    },

    render: function() {
      var value = '';
      if (this.vis.get(this.model_attribute)) value = this._DEFAULT_VALUE
      this.$el.html(this.template({ value: value }));
      return this;
    },

    _onInputFocusIn: function() { this.$('form').addClass('focus') },
    _onInputFocusOut: function() { this.$('form').removeClass('focus') },

    _onFormSubmit: function(e) {
      this.killEvent(e);
      var value = this.$('form input.password').val();
      this.vis.set(this.model_attribute, value);
    }

  });