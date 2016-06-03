<% if (columnType === 'string') { %>
<% _.each(value, function (color) { %>
<div class="CDB-ColorBar CDB-ColorBar--spaceMedium" style="background-color: <%- color %>">
</div>
<% }); %>
<% } else { %>
<button type="button" class="Editor-fillContainer">
  <ul class="CDB-ColorBarContainer">
    <% if (_.isArray(value)) { %>
    <li class="CDB-ColorBar CDB-ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
    <% } else { %>
    <li class="CDB-ColorBar" style="background-color: <%- value %>"></li>
    <% } %>
  </ul>
</button>
<% } %>
