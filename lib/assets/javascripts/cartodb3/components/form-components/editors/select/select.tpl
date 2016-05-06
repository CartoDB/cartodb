<div class="CDB-SelectFake CDB-Text js-button
  <% if (disabled) { %> is-disabled <% } %>
  <% if (empty) { %> is-empty <% } %>
  <% if (!name) { %> is-placeholder <% } %>"
  tabindex="0">
  <%- name || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
</div>
