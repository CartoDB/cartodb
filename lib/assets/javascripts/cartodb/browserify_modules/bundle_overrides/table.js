React = require('react');
Table = require('table/tableview');


// Mimic the original cdb.admin.TableView, so this replacement can act as a seamless replacement to render the table
// view, isolating the React rendering code to this view only.
cdb.admin.TableView = function(args) {
  var self = this;

  // The actual rendering is happening when the (table) model is triggered manually
  // see line ~144 in cartodb/table/table.js
  args.model.on("change", function() {
    self.render();
  });

  // The actual render call is not working, so don't use...
  this.render = function() {
    if (!this.el) {
      this.el = document.createElement('div');
      React.render(<Table
        table={args.model}
      />, this.el);
    }
    return this;
  };
};

cdb.admin.TableView.prototype.clean = function() {
  if (this.el) {
    React.unmountComponentAtNode(this.el);
    this.el = undefined;
  }
};

