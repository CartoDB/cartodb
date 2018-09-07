<div class="OrganizationSearch">
  <div class="OrganizationSearch-Item">
    <button class="OrganizationSearch-FormButton js-search-link u-alignCenter CDB-Text CDB-Size-medium u-actionTextColor">
      <i class="CDB-IconFont CDB-IconFont-lens"></i><%= _t('dashboard.views.organization.org_users.search') %>
    </button>
  </div>
  <div class="OrganizationSearch-Item">
    <form class="OrganizationSearch-Form js-search-form" action="#">
      <input class="OrganizationSearch-FormInput CDB-Text CDB-Size-medium u-secondaryTextColor js-search-input" type="text" placeholder="<%= _t('dashboard.views.organization.org_users.placeholder') %>" />
      <button type="button" class="CDB-Text CDB-Size-large u-actionTextColor OrganizationSearch-FormButton--clean js-clean-search" style="display: none;">x</button>
    </form>
  </div>
  <div class="u-flex u-alignCenter CDB-Text CDB-Size-small u-secondaryTextColor">
    <%= _t('dashboard.views.organization.org_users.seats', {assigned_seats: assigned_seats, seats: seats, assigned_viewer_seats: assigned_viewer_seats, viewer_seats: viewer_seats}) %>
  </div>
  <div class="OrganizationSearch-Item">
    <button class="CDB-Button CDB-Button--secondary CDB-Button--small js-addUserOptions">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
        <%= _t('dashboard.views.organization.org_users.add_usr') %>
        <i class="Button-arrowMenu CDB-IconFont CDB-IconFont-caretDown"></i>
      </span>
    </button>
  </div>
</div>

<div class="CDB-Text js-organizationUsersPanes"></div>
