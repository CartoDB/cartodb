<% if (state !== 'list' ) { %>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <% if (state === 'selected') { %>
      <% if (service_name === 'instagram') { %>
        <%- _t('components.modals.add-layer.imports.service-import.account-connected') %>
        <% } else { %>
        <%- _t('components.modals.add-layer.imports.service-import.item-selected') %>
      <% } %>
    <% } %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor <% if (state === "error") { %>ImportPanel-headerDescription--negative<% } %>">
    <% if (state === "idle") { %>
      <% if (fileExtensions.length > 0) { %>
        <% formatsLink = _t('components.modals.add-layer.imports.service-import.and') + ' <a target="_blank" rel="noopener noreferrer" href="https://docs.carto.com/cartodb-editor/datasets/#supported-file-formats" class="ImportPanel-headerDescriptionLink">' + _t('components.modals.add-layer.imports.service-import.many-more-formats') + '</a>' %>
        <%- fileExtensions.join(', ') %><% if (showAvailableFormats) { %> <%- formatsLink %> <% } %> <%- _t('components.modals.add-layer.imports.service-import.supported') %>.
      <% } else { %>
        <%- _t('components.modals.add-layer.imports.service-import.state-idle-login') %>
      <% } %>
    <% } %>
    <% if (state === "error") { %>
      <%- _t('components.modals.add-layer.imports.service-import.state-error', { title: title }) %>
    <% } %>
    <% if (state === "token") { %>
      <%- _t('components.modals.add-layer.imports.service-import.state-token') %>
    <% } %>
    <% if (state === "oauth") { %>
      <%- _t('components.modals.add-layer.imports.service-import.state-oauth') %>
    <% } %>
    <% if (state === "retrieving") { %>
      <%- _t('components.modals.add-layer.imports.service-import.state-retrieving', { title: title }) %>
    <% } %>
    <% if (state === "selected") { %>
      <% if (acceptSync) { %>
        <%- _t('components.modals.add-layer.imports.service-import.state-selected-sync') %>
      <% } else { %>
        <% if (service_name === 'instagram') { %>
          <%- _t('components.modals.add-layer.imports.service-import.state-selected-instagram') %>
        <% } else { %>
          <%- _t('components.modals.add-layer.imports.service-import.state-selected-no-sync') %>
        <% } %>
      <% } %>
    <% } %>
  </p>
  <% if (state === "selected" && items > 1) { %>
    <button class="ImportPanel-headerButton CDB-Text is-semibold u-upperCase CDB-Size-medium u-actionTextColor js-back">
      <i class="CDB-IconFont is-semibold CDB-IconFont-arrowPrev u-mr--4"></i>
      <span><%= _t('components.modals.add-layer.imports.header-import.go-back') %></span>
    </button>
  <% } %>
<% } %>
