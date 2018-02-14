<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemDisplay--flex CDB-Text CDB-Size-medium u-secondaryTextColor">
      <div class="CDB-ListDecoration-secondaryContainer">
        <button class="u-rSpace u-actionTextColor js-back" type="button">
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
      </div>

      <div class="CDB-ListDecoration-secondaryContainer CDB-ListDecoration-title u-rSpace--m">
        <span class="label u-ellipsis js-label"><%- label %></span>
      </div>

      <div class='CDB-ListDecoration-secondaryContainer'>
        <nav class='CDB-NavMenu'>
          <ul class='CDB-NavMenu-Inner CDB-NavMenu-inner--no-margin js-menu'>
            <li class='CDB-NavMenu-item'>
              <div class='CDB-NavMenu-link CDB-ListDecoration-rampNav-item'>
                <button class="ColorBar ColorBar--disableHighlight CDB-ListDecoration-rampItemBar u-rSpace--xl js-colorPicker" style="background-color: <%= color %>;" type="button"></button>
              </div>
            </li>

            <% if (imageEnabled) { %>
              <li class='CDB-NavMenu-item is-selected'>
                <div class='CDB-NavMenu-link CDB-ListDecoration-rampNav-item'>
                  <% if (image) { %>
                    <div class='CDB-ListDecoration-rampImg js-image-container'></div>
                  <% } else { %>
                    <span class="CDB-ListDecoration-rampImg CDB-Text js-assetPicker"><%= _t('form-components.editors.fill.input-color.img') %></span>
                  <% } %>
                </div>
              </li>
            <% } %>
          </ul>
        </nav>
      </div>
    </li>
  </ul>
</div>
