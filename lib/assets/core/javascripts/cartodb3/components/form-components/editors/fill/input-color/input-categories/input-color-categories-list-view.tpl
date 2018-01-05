<div class="CDB-Box-modalHeader">
  <% _.each(colors, function (ramp, index) { %>
    <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal js-foo" data-index="<%- index %>">
      <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
        <ul class="ColorBarContainer">
          <% _.each(ramp.slice(0, requiredNumberOfColors), function (color) { %>
            <li class="ColorBar ColorBar--spaceless" style="background-color: <%- color %>;"></li>
            <% }); %>
        </ul>
      </li>
    </ul>
    <% }); %>
</div>
<div class="js-content"></div>
<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor u-flex u-alignCenter">
      <ul class="ColorBarContainer">
        <% _.each(range, function (color) { %>
          <li class="ColorBar ColorBar--spaceless ColorBar--clickable js-color" style="background-color: <%- color %>;"></li>
          <% }); %>
      </ul>
    </li>
  </ul>
</div>