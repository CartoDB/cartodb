<div class="CDB-InputText CDB-Text is-cursor js-button
  <% if (disabled) { %> is-disabled <% } %>
  <% if (!label) { %> is-empty <% } %>"
  tabindex="0">
  <%- label || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
</div>
