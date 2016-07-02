<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis
  <% if (isDisabled) { %> is-disabled <% } %>
  <% if (!label) { %> is-empty <% } %>"
  tabindex="0">
  <% if (isEmpty) { %>
    <%- _t('components.backbone-forms.select.empty') %>
  <% } else { %>
    <%- label || _t('components.backbone-forms.select.placeholder', { keyAttr: keyAttr }) %>
  <% } %>
</div>
