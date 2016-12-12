
  /**
   *  Boolean field -> Place to choose any boolean value
   *  - It accepts a model with {attribute: 'colum', value: true}
   *  var boolean = new cdb.admin.BooleanField({ model: model })
   */

  cdb.admin.BooleanField = cdb.admin.StringField.extend({

    className: 'field boolean',

    default_options: {
      template_name: 'old_common/views/forms/boolean_field',
      label:          false,
      readOnly:       false
    },

    events: {
      'click a.radiobutton': '_onChange'
    },

    _onChange: function(e) {
      e.preventDefault();

      var $radio = $(e.target).closest('a.radiobutton') // Always within the view!
        , value = $radio.text().toLowerCase();
      
      if (this.model.get('value') != value) {
        this.model.set('value', value);
        this._setSelected($radio)
      }
    },

    _setSelected: function($radio) {
      this.$('a.selected').removeClass('selected');
      $radio.addClass('selected');
    },

    _resize: function() {},

    _triggerEvent: function(eventName, values) {
      this.trigger(eventName, values, this);
    }
  })