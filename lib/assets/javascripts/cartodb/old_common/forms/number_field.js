
  /**
   *  Number field -> Place to edit and capture number editions
   *  - It accepts a model with {attribute: 'colum', value: '1235'}
   *  - It validates the number before saving it
   *  var string = new cdb.admin.NumberField({ model: model })
   *
   */

  cdb.admin.NumberField = cdb.admin.StringField.extend({

    className: 'field number',

    default_options: {
      template_name: 'old_common/views/forms/number_field',
      label:          false,
      readOnly:       false
    },

    events: {
      'change input':   '_onChange',
      'keyup input':    '_onKeyUp',
      'keydown input':  '_onKeyDown'
    },

    // Check if the number is well formed or not
    _checkNumber: function(number) {
      var pattern = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)$/;
      if (pattern.test(number))
        return true
      else
        return false
    },

    _onChange: function(e) {
      var value = $(e.target).val();
      if (this._checkNumber(value)) {
        this.model.set('value', value);
      }
    },

    _onKeyDown: function(e) {
      var number = $(e.target).val();
      if ((((this.so=="mac" && e.metaKey) || (this.so=="rest" && e.ctrlKey)) && e.keyCode == 13) || e.keyCode == 13) {
        if (number === '' || this._checkNumber(number)) {
          this._setValid(number);
          this._triggerEvent('ENTER');
        }
      }
    },

    _onKeyUp: function(e) {
      var number = $(e.target).val();

      if (number === '' || this._checkNumber(number)) {
        this._setValid(number);
      } else {
        this._setInvalid(number);
      }
    },

    _setInvalid: function(number) {
      this.valid = false;
      this.$('input[type="text"]').addClass("error");
    },

    _setValid: function(number) {
      this.valid = true;

      if (number === '') {
        number = 'null';
      }

      this.$('input[type="text"]').removeClass("error");
      this.model.set('value', number);
    },

    _resize: function() {}

  })
