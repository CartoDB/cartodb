<div type="button" class="CDB-ListDecoration-itemLink <% if (isSelected) { %> is-selected <% } %>">
  <ul class="CDB-ColorBarContainer">
    <% _.each(name, function (color) { %>
      <li class="CDB-ColorBar CDB-ColorBar--spaceless" style="background-color: <%- color %>;"></li>
    <% }); %>
  </ul>
</div>

