    
  /**
   *  Infowindow field item  
   *
   */


  cdb.admin.mod.InfowindowFieldItem = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click .switch':    'toggle',
      'click .title':     'toggleTitle'
    },

    template: _.template('<span class="ellipsis"><%- fieldName %></span><div class="input"></div>'),

    initialize: function() {
      this.fieldName = this.options.field.name;
      this.fieldTitle = this.options.field.title;
      this.position  = this.options.position;
    },

    render: function() {
      this.$el.append(this.template(this));

      this._renderField();

      return this;
    },

    toggle: function(e) {
      e.preventDefault();

      if (!this.model.containsField(this.fieldName)) {
        this.model.addField(this.fieldName, this.position);
      } else {
        this.model.removeField(this.fieldName);
      }

      return false;
    },

    toggleTitle: function(e) {
      e.preventDefault();
      var t = this.model.getFieldProperty(this.fieldName, 'title');
      this.model.setFieldProperty(this.fieldName, 'title', !t);
      return false;
    },

    _renderField: function() {
      this.fieldModel = new cdb.core.Model({ title: this.model.getAlternativeName(this.fieldName) || this.fieldName });

      var self = this;

      this.fieldModel.bind("change:title", function() {
        self.model.setAlternativeName(self.fieldName, this.get("title"));
      });

      this.editInPlace = new cdb.admin.EditInPlace({
        observe: "title",
        model: this.fieldModel,
        stripHTML: true,
        disabled: !this.fieldTitle,
        el: this.$el.find(".input")
      });

      this.addView(this.editInPlace);
    }

  });