var $ = require('jquery');
var DropdownBaseView = require('./dropdown-base-view');

module.exports = DropdownBaseView.extend({

  show: function () {
    var dfd = $.Deferred();
    var self = this;
    // sometimes this dialog is child of a node that is removed
    // for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
      .css({
        marginTop: self.options.verticalPosition === 'down' ? '-10px' : '10px',
        opacity: 0,
        display: 'block'
      })
      .animate({
        margin: '0',
        opacity: 1
      }, {
        'duration': this.options.speedIn,
        'complete': function () {
          dfd.resolve();
        }
      });
    this.trigger('onDropdownShown', this.el);

    return dfd.promise();
  },

  /**
   * open the dialog at x, y
   */
  openAt: function (x, y) {
    var dfd = $.Deferred();

    this.$el.css({
      top: y,
      left: x,
      width: this.options.width
    })
      .addClass(
        (this.options.verticalPosition === 'up' ? 'vertical_top' : 'vertical_bottom') + ' ' +
        (this.options.horizontalPosition === 'right' ? 'horizontal_right' : 'horizontal_left') + ' ' +
        // Add tick class
        'tick_' + this.options.tick
      );

    this.modelView.set({open: true});

    // Show
    $.when(this.show()).done(function () {
      dfd.resolve();
    });
    // xabel: I've add the deferred to make it easily testable

    return dfd.promise();
  },

  hide: function (done) {
    // don't attempt to hide the dropdown if it's already hidden
    if (!this.isOpen) { done && done(); return; }

    var self = this;

    this.$el.animate({
      marginTop: self.options.verticalPosition === 'down' ? '10px' : '-10px',
      opacity: 0
    }, this.options.speedOut, function () {
      // Remove selected class
      $(self.options.target).removeClass('selected');

      // And hide it
      self.$el.hide();
      done && done();

      self.trigger('onDropdownHidden', self.el);
    });
  }
});
