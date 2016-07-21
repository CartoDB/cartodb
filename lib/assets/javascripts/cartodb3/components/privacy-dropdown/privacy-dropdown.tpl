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
      <svg viewBox="0 0 129 129" class="Privacy-dropdownArrow u-iBlock">
        <g>
          <path d="m121.3,34.6c-1.6-1.6-4.2-1.6-5.8,0l-51,51.1-51.1-51.1c-1.6-1.6-4.2-1.6-5.8,0-1.6,1.6-1.6,4.2 0,5.8l53.9,53.9c0.8,0.8 1.8,1.2 2.9,1.2 1,0 2.1-0.4 2.9-1.2l53.9-53.9c1.7-1.6 1.7-4.2 0.1-5.8z"/>
        </g>
      </svg>
    <% } %>
  </button>
  <% } else { %>
    <i class="Tag Tag--big Tag--outline u-flex u-alignCenter <%- cssClass %> CDB-Text CDB-Size-small u-upperCase">
    <%- privacy %>
    </i>
  <% } %>

  <div class="js-dialog"></div>
</div>