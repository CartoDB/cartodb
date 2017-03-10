<div class="js-content"></div>
<div class="CDB-Text CDB-Size-medium CustomList-listWrapper">
  <ul class="CustomList-list js-list">
    <% if (customRamp) { %>
    <li class="CDB-ListDecoration-item CustomList-item js-listItem">
      <div class="CDB-ListDecoration-itemLink CDB-ListDecoration-itemLink--double js-listItemLink is-selected">
        <ul class="ColorBarContainer">
          <% _.each(customRamp, function (color) { %>
          <li class="ColorBar ColorBar--spaceless" style="background-color: <%- color %>;"></li>
          <% }); %>
        </ul>
      </div>
    </li>
    <% } %>
    <li class="CDB-ListDecoration-item CustomList-item js-listItem">
      <button class="CDB-ListDecoration-itemLink CDB-ListDecoration-itemLink--double js-listItemLink js-customize u-actionTextColor">Custom color set</button>
    </li>
  </ul>
</div>
