<li class="CDB-ListDecoration-item CustomList-item CustomRamp js-customRampItem">
  <div class="CustomRamp-listOptions CDB-ListDecoration-itemLink CDB-ListDecoration-itemLink--double js-customRamp js-listItemLink is-selected">
    <ul class="ColorBarContainer">
      <% _.each(customRamp, function (color) { %>
      <li class="ColorBar ColorBar--disableHighlight ColorBar--spaceless" style="background-color: <%- color %>;"></li>
      <% }); %>
    </ul>
  </div>
  <button class="CDB-ListDecoration-itemLink CustomRamp-clear js-clear">
    <div class="CDB-Shape">
      <div class="CDB-Shape-close is-blue is-large"></div>
    </div>
  </button>
</li>
