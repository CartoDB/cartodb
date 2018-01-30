<div class="ColorBarWrapper--withInvertLink CDB-ListDecoration-itemLink CDB-ListDecoration-itemLink--double js-listItemLink <% if (isSelected) { %> is-selected <% } %>">
  <ul class="ColorBarContainer">
    <% _.each(colors, function (color) { %>
    <li class="ColorBar ColorBar--spaceless" style="background-color: <%- color %>;"></li>
    <% }); %>
  </ul>
</div>
