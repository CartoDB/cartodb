<% if (failed) { %>
  <p class="ImportItem-text CDB-Text CDB-Size-small is-failed" title="<%- name %>">
    <%- _t('components.background-importer.background-importer-item.error-connecting', { name: name }) %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
  </p>
<% } else if (completed && !warnings) { %>
  <p class="ImportItem-text CDB-Text CDB-Size-small is-completed" title="<%- name %>">
    <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %> <%- _t('components.background-importer.background-importer-item.completed') %>!
  </p>
<% } else if (completed && warnings) { %>
  <p class="ImportItem-text CDB-Text CDB-Size-small has-warnings" title="<%- name %>">
    Some warnings were produced for <%- name %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
  </p>
<% } else { %>
  <p class="ImportItem-text CDB-Text CDB-Size-small" title="<%- name %>">
    <span class="ImportItem-textState"><%- state %></span> <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
    <%- progress %>%
  </p>
<% } %>
