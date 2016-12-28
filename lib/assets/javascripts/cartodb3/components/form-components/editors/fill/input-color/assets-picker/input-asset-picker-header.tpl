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
            <li class='CDB-NavMenu-item'>
              <button class="ColorBar CDB-ListDecoration-rampItemBar u-rSpace--xl js-colorPicker" style="background-color: <%= color %>;"></button>
            </li>
            <li class='CDB-NavMenu-item is-selected'>
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
