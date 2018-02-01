<% if (failed) { %>
    <%- _t('components.background-importer.background-importer-item.error-connecting', { name: name }) %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
<% } else if (completed && !warnings) { %>
    <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %> <%- _t('components.background-importer.background-importer-item.completed') %>!
<% } else if (completed && warnings) { %>
    Some warnings were produced for <%- name %> <% if (service) { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
<% } else { %>
    <%- progress %>% <%- state %> <%- name %> <% if (service && service != "twitter_search") { %> <%- _t('components.background-importer.background-importer-item.from') %> <%- service %> <% } %>
<% } %>
