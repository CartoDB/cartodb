<button type="button" class="CDB-ColorBarContainer CDB-OptionInput-content">
  <% if (_.isArray(value)) { %>
  <% _.each(value, function (color) { %>
  <ul class="CDB-ColorBarContainer">
    <li class="CDB-ColorBar CDB-ColorBar--spaceless" style="background-color: <%- color %>;"></li>
  </ul>
  <% }); %>
  <% } else { %>
  <span class="CDB-ColorBar" style="background-color: <%- value %>; opacity: <%- opacity %>"></span>
  <% } %>
</button>
