<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> u-actionTextColor">
  <% _.each(name, function (color) { %>
  <div style="width:100px; height: 20px; background-color: <%- color %>"></div>
  <% }); %>
</button>
