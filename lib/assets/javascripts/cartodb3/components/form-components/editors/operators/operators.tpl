<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis
  <% if (disabled) { %> is-disabled <% } %>
  <% if (!name) { %> is-empty <% } %>"
  tabindex="0">
  <%- name || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
</div>
