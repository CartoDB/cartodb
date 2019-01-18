
  /**
   *  String field -> Place to edit and capture string editions
   *  - It accepts a model with {attribute: 'colum', value: 'jamón'}
   *  var string = new cdb.admin.StringField({ model: model })
   */

  cdb.admin.StringField = cdb.core.View.extend({

    tagName: 'div',
    className: 'field string',

    default_options: {
      template_name:  'old_common/views/forms/string_field',
      label:          false,
      autoResize:     true,
      readOnly:       false
    },

    events: {
      'change textarea':    '_onChange',
      'keydown textarea':  '_onKeyDown'
    },

    initialize: function() {
      _.defaults(this.options, this.default_options);

      _.bindAll(this, '_onChange', '_onKeyDown');

      this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);

      // Setting valid value from the beginning
      this.valid = true;

      // Get Operating System
      this._setOS();
    },

    render: function() {
      this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options)));

      if (this.options.readOnly) {
        this.undelegateEvents();
      }

      // Hack to resize correctly the textarea
      if (this.options.autoResize)
        this._resize();

      return this;
    },

    _setOS: function() {
      // Check if the SO is Mac or rest in order to use Ctrl or CMD + ENTER to save the value
      var ua = navigator.userAgent.toLowerCase();

      this.so = "rest";
      if (/mac os/.test(ua)) {
        this.so = "mac";
      }
    },

    // Public function to answer if the editor is valid or not
    isValid: function() {
      return this.valid;
    },

    _onChange: function(e) {
      var value = $(e.target).val();
      this.model.set('value', value);
    },

    _onKeyDown: function(e) {
      if (((this.so=="mac" && e.metaKey) || (this.so=="rest" && e.ctrlKey)) && e.keyCode == 13 ) {
        e.preventDefault();
        this._triggerEvent('ENTER');
        return false;
      }

      var value = $(e.target).val();

      this.model.set('value', value);

      if (this.options.autoResize)
        this._resize();
    },

    // Hack function to resize automatially textarea
    _resize: function() {
      var $textarea = this.$("textarea");

      // Hello hacky boy
      if ($textarea)
        setTimeout(function() {
          $textarea.height(20);
          $textarea.height($textarea[0].scrollHeight - 22);
        });
    },

    _triggerEvent: function(eventName, values) {
      this.trigger(eventName, values, this);
    }
  })
