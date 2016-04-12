<% if (failed) { %>
  <div class="ImportItem-text is-failed" title="<%- name %>">
    <%- _t('components.background-importer.background-importer-item.error-connecting', { name: name }) %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
  </div>
  <button class="Button Button-importShowDetails u-upperCase js-show_error"><%- _t('components.background-importer.background-importer-item.show') %></button>
  <button class="ImportItem-closeButton js-close">
    <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
  </button>
<% } else if (completed && !warnings) { %>
  <div class="ImportItem-text is-completed" title="<%- name %>">
    <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %> <%- _t('components.background-importer.background-importer-item.completed') %>!
  </div>
  <% if (showSuccessDetailsButton) { %>
    <% if (service && service === "twitter_search") { %>
      <button class="Button Button-importShowDetails u-upperCase js-show_stats"><%- _t('components.background-importer.background-importer-item.show') %></button>
    <% } else if (tables_created_count === 1) { %>
      <a href="<%- url %>" class="Button Button-importShowDetails u-upperCase js-show"><%- _t('components.background-importer.background-importer-item.show') %></a>
    <% } %>
  <% } %>
  <button class="ImportItem-closeButton js-close">
    <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
  </button>
<% } else if (completed && warnings) { %>
  <div class="ImportItem-text has-warnings" title="<%- name %>">
    Some warnings were produced for <%- name %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
  </div>
  <button class="Button Button-importShowDetails u-upperCase js-show_warnings"><%- _t('components.background-importer.background-importer-item.show') %></button>
  <button class="ImportItem-closeButton js-close">
    <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
  </button>
<% } else { %>
  <div class="ImportItem-text" title="<%- name %>">
    <span class="ImportItem-textState"><%- state %></span> <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
  </div>
  <div class="ImportItem-progress">
    <div class="progress-bar">
      <span class="bar-2" style="width:<%- progress %>%"></span>
    </div>
  </div>
  <% if (state === "uploading" && step === "upload") { %>
    <button class="ImportItem-closeButton js-abort">
      <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
    </button>
  <% } %>
<% } %>
