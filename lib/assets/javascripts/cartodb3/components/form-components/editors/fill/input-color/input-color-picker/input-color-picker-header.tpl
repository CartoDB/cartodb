<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <button class="u-rSpace--xl u-actionTextColor js-back">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <span class="label js-label"><%- label %></span>
    </li>
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="CDB-ColorBarContainer">
        <% _.each(ramp, function (color, i) { %>
        <li class="CDB-ColorBar is-link CDB-ColorBar--spaceless js-color<%- i === index ? ' is-selected' : '' %>" data-label="<%- color.title %>" data-color="<%- color.color %>" style="background-color: <%- color.color %>;"></li>
        <% }); %>
      </ul>
    </li>
  </ul>
</div>
