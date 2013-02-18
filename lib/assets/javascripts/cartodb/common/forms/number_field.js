  
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
      template_name: 'common/views/forms/number_field',
      label:          false,
      readOnly:       false
    },

    events: {
      'change input': '_onChange',
      'keyup input':  '_onKeyUp'
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

    _onKeyDown: function() {},

    _onKeyUp: function(e) {
      var number = $(e.target).val();

      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        this._triggerEvent('ENTER');
        return false;
      }

      if (number === '' || this._checkNumber(number)) {
        this.valid = true;
        this.model.set('value', number);
        $(e.target).removeClass("error");
      } else {
        this.valid = false;
        $(e.target).addClass("error");
      }
    }
  })