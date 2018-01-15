<div class="Privacy-dropdown">
  <<%- privacyDOMElement %> class="Privacy-dropdownTrigger Tag Tag-fill Tag-fill--<%- cssClass %> CDB-Text CDB-Size-small u-upperCase js-tooltip <% if (hasWriteAccess) { %>js-toggle<% } else { %>is-disabled is-pointed<% } %>">
    <% if (isLoading) { %>
      <div class="CDB-LoaderIcon CDB-LoaderIcon--small u-flex">
        <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
          <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>
      </div>
    <% } else { %>
      <%- privacy %>
    <% } %>
  </<%- privacyDOMElement %>>

  <div class="js-dialog"></div>
</div>
