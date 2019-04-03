<% if (value.safeHTML) { %>
  <p class="u-ellipsis CDB-Text CDB-Size-medium u-secondaryTextColor js-description"  title="<%- value.clean %>"><%= value.clean %></p>
<% } else { %>
  <% if (editable) { %>
    <button class="EditableField-button CDB-Text CDB-Size-medium u-actionTextColor js-add-btn"><%= _t('dashboard.components.editable_fields.editable_description.add_desc') %></button>
    <textarea class="EditableField-input CDB-Text CDB-Size-medium u-secondaryTextColor js-field-input" maxlength="<%- maxLength %>"></textarea>
  <% } else { %>
  <div class="DefaultDescription CDB-Text CDB-Size-medium u-altTextColor">
    <span class="NoResults"><%= _t('dashboard.components.editable_fields.editable_description.no_desc') %></span>
  </div>
  <% } %>
<% } %>


