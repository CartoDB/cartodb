<div class="js-signInMessageContainer"></div>

<form class="Form InviteUsers-formContent js-invitesForm">
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label"><%= _t('dashboard.views.organization.invite_users.users_email') %></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <div class="Form-tags js-tags" data-title="<%= _t('dashboard.views.organization.invite_users.separate') %>">
        <ul class="Form-tagsList js-tagsList"></ul>
      </div>
    </div>
    <div class="Form-rowInfo">
      <p class="Form-rowInfoText Form-rowInfoText--error Form-rowInfoText--multipleLines js-emailError"><%= _t('dashboard.views.organization.invite_users.email_used') %></p>
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label">Welcome text</label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <textarea class="CDB-Textarea Form-input Form-input--longer Form-textarea js-welcomeText" placeholder="Send them a welcome text"><%- welcomeText %></textarea>
    </div>
    <div class="Form-rowInfo"></div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="Form-label">Viewer user</label>
    </div>
    <div class="Form-rowData Form-rowData--longer InviteUsers-userType">
      <div class="Toggler js-toggler InviteUsers-userTypeToggler <% if (!viewerEnabled) { %>is-disabled<% } %>"
             <% if (!viewerEnabled) { %>title="<%= _t('dashboard.views.organization.invite_users.no_viewers') %>"<% } %>>
        <input type="checkbox" id="InviteUsers-userType" name="viewer" class="js-input" <% if (!viewerEnabled) { %>disabled="disabled"<% } %>/>
        <label for="InviteUsers-userType"></label>
      </div>
      <div class="Form-label"><%= _t('dashboard.views.organization.invite_users.read_only') %></div>
    </div>
  </div>

  <div class="InviteUsers-formFooterSticky">
    <div class="Dialog-footer InviteUsers-formFooter">
      <div><%/* placeholder for flex layout */%></div>
      <button type="submit" class="CDB-Button CDB-Button--primary is-disabled js-submit">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.invite_users.invite_users') %></span>
      </button>
    </div>
  </div>
</form>
