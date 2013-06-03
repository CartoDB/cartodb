
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
      'change input':   '_onChange',
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

      if (number === '' || this._checkNumber(number)) {

        if ((((this.so=="mac" && e.metaKey) || (this.so=="rest" && e.ctrlKey)) && e.keyCode == 13) || e.keyCode == 13) {
          e.preventDefault();
          e.stopPropagation();

          this._triggerEvent('ENTER');
          return false;
        }

        this.valid = true;

        if (number === '') {
          number = 'null';
        }

        this.model.set('value', number);
        $(e.target).removeClass("error");
      } else {
        this.valid = false;
        this.model.set('value', number);
        $(e.target).addClass("error");
      }
    },

    _resize: function() {}

  })
