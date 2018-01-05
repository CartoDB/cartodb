<div class="CDB-Box-modal CustomList">
  <div class="CDB-Text CDB-Size-medium CustomList-listWrapper">
    <ul class="CustomList-list ps-container ps-theme-default ps-active-y">
      <% _.each(colors, function (ramp, index) { %>
        <li class="CDB-ListDecoration-item CustomList-item" >
          <div class="ColorBarWrapper--withInvertLink CDB-ListDecoration-itemLink CDB-ListDecoration-itemLink--double js-ramp" data-index="<%- index %>">
            <ul class="ColorBarContainer">
              <% _.each(ramp.slice(0, requiredNumberOfColors), function (color) { %>
                <li class="ColorBar ColorBar--spaceless" style="background-color: <%- color %>;"></li>
                <% }); %>
            </ul>
          </div>
        </li>
        <% }); %>
    </ul>
  </div>
</div>

<div class="CDB-Text CDB-Size-medium CustomRamp-list CustomList-listWrapper js-custom-color-set">
  <ul class="CustomList-list">
    <li class="CDB-ListDecoration-item CustomList-item CustomList-item--add">
      <button class="CDB-ListDecoration-itemLink u-actionTextColor ">Custom color set</button>
    </li>
  </ul>
</div>