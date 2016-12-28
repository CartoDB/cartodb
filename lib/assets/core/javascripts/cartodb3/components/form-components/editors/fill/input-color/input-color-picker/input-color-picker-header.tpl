<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-ListDecoration-itemDisplay--flex CDB-Text CDB-Size-medium u-secondaryTextColor">
      <div class='CDB-ListDecoration-secondaryContainer'>
        <button class="u-rSpace u-actionTextColor js-back">
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
        <span class="label js-label"><%- label %></span>
      </div>

      <div class='CDB-ListDecoration-secondaryContainer'>
        <nav class='CDB-NavMenu'>
          <ul class='CDB-NavMenu-Inner CDB-NavMenu-inner--no-margin js-menu'>
            <li class='CDB-NavMenu-item is-selected'>
              <div class="ColorBar CDB-ListDecoration-rampItemBar u-rSpace--xl js-colorPicker" style="background-color: <%= color %>;"></div>
            </li>
            <li class='CDB-NavMenu-item'>
              <% if (image) { %>
                <div class='js-image-container'></div>
              <% } else { %>
                <span class="CDB-ListDecoration-rampImg CDB-Text u-actionTextColor js-assetPicker"><%= _t('form-components.editors.fill.input-color.img') %></span>
              <% } %>
            </li>
          </ul>
        </nav>
      </div>
    </li>
  </ul>
</div>

<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
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
