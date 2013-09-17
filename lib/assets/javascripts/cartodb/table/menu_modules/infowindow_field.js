  
  /**
   *  Infowindow field view
   *
   */


  cdb.admin.mod.InfowindowField = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click .switch':    'toggle',
      'click .title':     'toggleTitle'
    },

    template: _.template(
      '<span class="ellipsis"><%- fieldName %></span>\
      <div class="switches">\
        <a href="#title" class="checkbox small light title">\
          <span class="check"></span>\
          title?\
        </a>\
        <a href="#switch" class="switch">\
          <span class="handle"></span>\
        </a>\
      </div>'),

    initialize: function() {
      this.fieldName = this.options.field;
      this.position  = this.options.position;

      this.model.bind('change:fields', this.fieldChange, this);
    },

    render: function() {
      this.$el.append(this.template(this));
      this.fieldChange();
      this.$el.attr('cid', this.cid);
      this.$el.addClass('drag_field');

      return this;
    },

    fieldChange: function() {
      var $title = this.$('.title');
      var $switch = this.$('.switch');

      // field
      var f = this.model.containsField(this.fieldName);

      if (f) {
        $switch.removeClass('disabled').addClass('enabled');
      } else {
        $switch.removeClass('enabled').addClass('disabled');
      }

      // title
      var t = this.model.getFieldProperty(this.fieldName, 'title');

      if (f) {
        $title.removeClass('enabled disabled');
        if (t) $title.addClass('enabled');
      } else {
        $title.removeClass('enabled').addClass('disabled');
      }
      
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
    }
  });