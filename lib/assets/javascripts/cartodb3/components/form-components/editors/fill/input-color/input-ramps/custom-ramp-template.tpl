<% if (customRamp && customRamp.length) { %>
<li class="CDB-ListDecoration-item CustomList-item CustomRamp js-customRampItem">
  <div class="CDB-ListDecoration-itemLink js-customRamp js-listItemLink is-selected">
    <ul class="ColorBarContainer">
      <% _.each(customRamp, function (color) { %>
      <li class="ColorBar ColorBar--spaceless" style="background-color: <%- color %>;"></li>
      <% }); %>
    </ul>
  </div>
  <button class="CDB-ListDecoration-itemLink CustomRamp-clear js-clear">x</button>
</li>
<% } %>
