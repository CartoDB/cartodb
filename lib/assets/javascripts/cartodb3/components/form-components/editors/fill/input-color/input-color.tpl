<% if (showCategories) { %>
<% _.each(value, function (color) { %>
<div class="ColorBar ColorBar--spaceMedium" style="background-color: <%- color %>">
</div>
<% }); %>
<% } else { %>
<button type="button" class="Editor-fillContainer">
  <ul class="ColorBarContainer">
    <% if (_.isArray(value)) { %>
    <li class="ColorBar ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
    <% } else { %>
    <li class="ColorBar" style="background-color: <%- value %>"></li>
    <% } %>
  </ul>
</button>
<% } %>
