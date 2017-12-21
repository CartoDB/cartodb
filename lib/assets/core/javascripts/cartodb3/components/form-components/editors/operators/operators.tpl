<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis
  <% if (disabled) { %> is-disabled <% } %>
  <% if (!name) { %> is-empty <% } %>
  <% if (help) { %> js-help<% } %>"
  <% if (help) { %> data-tooltip="<%- help %>"<% } %>
  tabindex="0">
  <%- name || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
</div>
