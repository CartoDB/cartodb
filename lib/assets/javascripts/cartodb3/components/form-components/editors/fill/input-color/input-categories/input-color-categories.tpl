<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="InputColor-modalHeader CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <div>
        <button class="u-rSpace--xl u-actionTextColor js-back">
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
        <span class="label js-label"><%- attribute %></span>
      </div>

      <% if (columnType === 'number') { %>
      <div class="CDB-Text CDB-Size-small js-switch" data-tooltip="<%- _t('form-components.editors.fill.switch.to-ramps') %>">
        <input class="CDB-Toggle u-iBlock" type="checkbox" name="switch">
        <span class="u-iBlock CDB-ToggleFace"></span>
      </div>
      <% } %>
    </li>
  </ul>
</div>

<div class="InputColorCategory-loader js-loader is-hidden">
  <div class="CDB-LoaderIcon is-dark">
    <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
    </svg>
  </div>
</div>

<div class="InputColorCategory-content js-content"></div>
