<div class="Privacy-dropdown">
  <% if (isDropdown) { %>
  <button class="Privacy-dropdownTrigger Tag Tag--big Tag--outline <%- cssClass %> CDB-Text CDB-Size-small u-upperCase js-toggle">
    <% if (isLoading) { %>
      <div class="CDB-LoaderIcon CDB-LoaderIcon--small is-dark u-flex">
        <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
          <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>
      </div>
    <% } else { %>
      <%- privacy %>
    <% } %>
  </button>
  <% } else { %>
    <i class="Tag Tag--big Tag--outline u-flex u-alignCenter <%- cssClass %> CDB-Text CDB-Size-small u-upperCase">
    <%- privacy %>
    </i>
  <% } %>

  <div class="js-dialog"></div>
</div>