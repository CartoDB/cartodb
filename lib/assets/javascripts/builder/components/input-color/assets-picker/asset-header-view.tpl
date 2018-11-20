<ul>
  <li class="CDB-NavSubmenu-item">
    <h2 class="CDB-Text CDB-Size-medium u-altTextColor"><%- title %></h2>
  </li>
  <% if (editable && assetsCount > 0) { %>
    <% if (allSelected) { %>
      <li class="CDB-NavSubmenu-item">
        <button class="CDB-NavSubmenu-itemLink CDB-Text CDB-Size-medium u-actionTextColor js-deselect-all"><%- _t('components.modals.assets-picker.deselect-all') %></button>
      </li>
      <% } else if (selectedCount > 0) { %>
      <li class="CDB-NavSubmenu-item">
        <button class="CDB-NavSubmenu-itemLink CDB-Text CDB-Size-medium u-actionTextColor js-select-all"><%- _t('components.modals.assets-picker.select-all') %></button>
      </li>
    <% } %>

    <% if (selectedCount > 0) { %>
      <li class="CDB-NavSubmenu-item">
          <% if (selectedCount > 1) { %>
        <button class="CDB-NavSubmenu-itemLink CDB-Text CDB-Size-medium u-errorTextColor js-remove"><%- _t('components.modals.assets-picker.delete-images') %></button>
        <% } else { %>
        <button class="CDB-NavSubmenu-itemLink CDB-Text CDB-Size-medium u-errorTextColor js-remove"><%- _t('components.modals.assets-picker.delete-image') %></button>
        <% } %>
      </li>
    <% } %>
  <% } %>
</ul>
