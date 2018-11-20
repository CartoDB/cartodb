<div class="CDB-ListDecoration-itemLink <% if (isSelected) { %> is-selected <% } %>">
  <div class="u-flex u-justifySpace u-alignCenter">
    <span class="RampItem-text CDB-Text u-ellipsis u-actionTextColor" title="<%- name %>"><%- name %></span>

    <div class='RampItem-secondaryContainer'>
      <div class="ColorBar ColorBar--disableHighlight RampItem-bar js-colorPicker" style="background-color: <%- val %>;"></div>

      <% if (imageEnabled) { %>
        <div class='RampItem-img'>
          <% if (image) { %>
            <div class='js-image-container u-flex'></div>
          <% } else { %>
            <button class="CDB-Text u-actionTextColor js-assetPicker"><%= _t('form-components.editors.fill.input-color.img') %></button>
          <% } %>
        </div>
      <% } %>
    </div>
  </div>
</div>
