<% if (isDone) { %>
  <div class="HorizontalBlockList-item-actionBlock CDB-Text CDB-Size-small u-upperCase js-tooltip" data-tooltip="<%- name %>">
    <span class="HorizontalBlockList-item-text">
      <%- nodeId %>
    </span>
    <% if (!isNew) { %>
      <i class="CDB-IconFont CDB-IconFont-ray CDB-Size-medium HorizontalBlockList-item-icon"></i>
    <% } %>
  </div>
<% } else { %>
  <% if (isSelected) { %>
    <div class="CDB-LoaderIcon js-tooltip" data-tooltip="<%- name %>">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  <% } else { %>
    <div class="CDB-LoaderIcon is-dark js-tooltip" data-tooltip="<%- name %>">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
  <% } %>
<% } %>

<% if (hasError) { %>
<div class="Editor-ListAnalysis-itemError"></div>
<% } %>
