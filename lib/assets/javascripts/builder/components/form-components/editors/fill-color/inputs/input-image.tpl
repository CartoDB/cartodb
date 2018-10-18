<% if (image && !isCustomMarker) { %>
<button type="button" class="Editor-fillImage <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <div class="IconContainer js-image-container"></div>
</button>
<% } %>

<% if (!image || isCustomMarker) { %>
<button type="button" class="Editor-fillImage <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <div class='CDB-Text CDB-FontSize-small u-altTextColor is-semibold u-upperCase'><%= _t('form-components.editors.fill.input-color.img') %></div>
</button>
<% } %>
