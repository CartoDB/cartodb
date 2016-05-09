<div class="CDB-InputText CDB-Text is-cursor js-button
  <% if (disabled) { %> is-disabled <% } %>
  <% if (empty || !name) { %> is-empty <% } %>"
  tabindex="0">
  <%- name || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
</div>
