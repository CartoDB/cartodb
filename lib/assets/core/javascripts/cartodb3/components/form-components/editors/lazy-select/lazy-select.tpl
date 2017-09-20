<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis
  <% if (isDisabled) { %> is-disabled <% } %>
  <% if (!label) { %> is-empty <% } %>
  <% if (isNull) { %> is-empty <% } %>"
  tabindex="0"
  title="<%- title %>">
    <% if (isEmpty && isNull) { %>
      <%- _t('components.backbone-forms.select.empty') %>
    <% } else { %>
      <%- label %>
    <% } %>
</div>
