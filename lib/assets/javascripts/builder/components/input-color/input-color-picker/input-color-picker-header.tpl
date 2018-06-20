<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemDisplay--flex CDB-Text CDB-Size-medium u-secondaryTextColor">
      <div class="CDB-ListDecoration-secondaryContainer">
        <button class="u-rSpace u-actionTextColor js-back" type="button">
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
      </div>

      <div class="CDB-ListDecoration-secondaryContainer CDB-ListDecoration-title u-rSpace--m">
        <span class="label u-ellipsis js-label"><%- label %></span>
      </div>

      <% if (isCategorized && imageEnabled) { %>
        <div class='CDB-ListDecoration-secondaryContainer'>
          <nav class='CDB-NavMenu'>
            <ul class='CDB-NavMenu-Inner CDB-NavMenu-inner--no-margin js-menu'>
              <li class='CDB-NavMenu-item is-selected'>
                <div class='CDB-NavMenu-link CDB-ListDecoration-rampNav-item'>
                  <button class='ColorBar ColorBar--disableHighlight CDB-ListDecoration-rampItemBar u-rSpace--xl js-colorPicker' type="button" style="background-color: <%= color %>;"></button>
                </div>
              </li>
              <li class='CDB-NavMenu-item'>
                <div class='CDB-NavMenu-link CDB-ListDecoration-rampNav-item'>
                  <% if (image) { %>
                    <button class="CDB-ListDecoration-rampImg js-image-container" type="button"></button>
                  <% } else { %>
                    <button class="CDB-ListDecoration-rampImg CDB-Text u-actionTextColor js-assetPicker" type="button"><%= _t('form-components.editors.fill.input-color.img') %></button>
                  <% } %>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      <% } %>
    </li>
  </ul>
</div>

<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="ColorBarContainer ColorBarContainer--rampEditing">
        <% _.each(ramp, function (color, i) { %>
        <li class="ColorBar ColorBar--spaceless ColorBar--clickable is-link js-color<%- i === index ? ' is-selected' : '' %>" data-label="<%- color.title %>" data-color="<%- color.color %>" style="background-color: <%- color.color %>;"></li>
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
