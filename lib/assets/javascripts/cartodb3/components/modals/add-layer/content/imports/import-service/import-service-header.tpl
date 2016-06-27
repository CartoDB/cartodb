<% if (state !== 'list' ) { %>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <% if (state === 'selected') { %>
      <% if (service_name === 'instagram') { %>
        <%- _t('components.modals.add-layer.imports.service-import.account-connected') %>
        <% } else { %>
        <%- _t('components.modals.add-layer.imports.service-import.item-selected') %>
      <% } %>
    <% } else { %>
      <%- _t('components.modals.add-layer.imports.service-import.connect-with', { title: title }) %>
    <% } %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor <% if (state === "error") { %>ImportPanel-headerDescription--negative<% } %>">
    <% if (state === "idle") { %>
      <% if (fileExtensions.length > 0) { %>
        <% formatsLink = _t('components.modals.add-layer.imports.service-import.and') + ' <a target="_blank" href="http://docs.cartodb.com/cartodb-editor/datasets/#supported-file-formats" class="ImportPanel-headerDescriptionLink">' + _t('components.modals.add-layer.imports.service-import.many-more-formats') + '</a>' %>
        <%- fileExtensions.join(', ') %><% if (showAvailableFormats) { %> <%- formatsLink %> <% } %> <%- _t('components.modals.add-layer.imports.service-import.supported') %>.
      <% } else { %>
        <%- _t('components.modals.add-layer.imports.service-import.state-idle-login') %>
      <% } %>
    <% } %>
    <% if (state === "error") { %>
      <%- _t('components.modals.add-layer.imports.service-import.state-error') %>
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
    <button class="CDB-Size-large ImportPanel-headerButton js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev u-actionTextColor"></i>
    </button>
  <% } %>
<% } %>
