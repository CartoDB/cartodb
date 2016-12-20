<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <button class="u-rSpace u-actionTextColor js-back">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
      </button>
      <span class="label js-label"><%- label %></span>
    </li>
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="ColorBarContainer ColorBarContainer--rampEditing">
        <% _.each(ramp, function (color, i) { %>
        <li class="ColorBar is-link ColorBar--spaceless js-color<%- i === index ? ' is-selected' : '' %>" data-label="<%- color.title %>" data-color="<%- color.color %>" style="background-color: <%- color.color %>;"></li>
        <% }); %>
      </ul>
      <div class="OpacityEditor">
        <div class="OpacityEditor-slider js-slider"></div>
        <div class="OpacityEditor-inputWrapper">
          <input type="text" class="CDB-InputText ColorPicker-input js-a" value="<%- opacity %>">
        </div>
      </div>
    </li>
  </ul>
</div>
