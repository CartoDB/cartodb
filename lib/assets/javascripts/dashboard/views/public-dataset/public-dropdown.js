const _ = require('underscore');
const DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');

const PublicDropdown = DropdownAdminView.extend({
  _TEMPLATE: `
    <ul>
      <li><a class="small" href="<%- urls[0] %>">View your datasets</a></li>
      <li><a class="small" href="<%- urls[0] %>/visualizations">View your maps</a></li>
      <li><a class="small" href="<%- urls[0].replace("dashboard", "logout") %>">Close session</a></li>
    </ul>
  `,

  render: function () {
    this.$el
      .html(_.template(this._TEMPLATE)(this.model.attributes))
      .css({
        width: this.options.width
      });

    return this;
  }
});

module.exports = PublicDropdown;
