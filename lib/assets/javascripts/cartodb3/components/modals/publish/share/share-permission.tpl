<div class="Share-permissionInfo">
  <div class="Share-permissionIcon">
    <% if (avatar) { %>
      <div class="Share-user Share-user--huge" style="background-image: url(<%- avatar %>)"></div>
    <% } else { %>
        <i class="CDB-IconFont CDB-IconFont-people"></i>
    <% } %>
  </div>
  <div>
    <div class="CDB-Text u-mainTextColor CDB-Size-medium is-semibold u-ellipsis">
      <%- name %>
    </div>


    <div class="CDB-Text u-mainTextColor u-tSpace CDB-Size-medium u-ellipsis">
      <% if (role) { %>
        <i class="Tag Tag--outline Tag--<%- role %> CDB-Text CDB-Size-small u-upperCase"><%- role %></i>
      <% } %>

      <% if (users) { %>
        <div class="js-users"></div>
      <% } %>
    </div>


    <% if (description) { %>
    <div class="CDB-Text u-mainTextColor u-tSpace CDB-Size-medium u-ellipsis">
      <%- description %>
    </div>
    <% } %>
  </div>
</div>
<div class="Share-togglers">
  <% if (hasWriteAccessAvailable) { %>
    <div class="CDB-Text CDB-Size-medium u-rSpace--xl Share-toggler js-toggler <% if (!canChangeWriteAccess) { %>is-disabled<% } %>">
      <input class="CDB-Toggle u-iBlock js-write" type="checkbox"
        <% if (!canChangeWriteAccess) { %>disabled="disabled"<% } %>
        <% if (hasWriteAccess) { %> checked <% } %>
      />
      <span class="u-iBlock CDB-ToggleFace"></span>
      <label class="u-iBlock u-altTextColor "><%- _t('components.modals.publish.share.toggle.write') %></label>
    </div>
  <% } %>
  <div class="CDB-Text CDB-Size-medium Share-toggler js-toggler <% if (!canChangeReadAccess) { %>is-disabled<% } %>">
    <input class="CDB-Toggle u-iBlock js-read" type="checkbox"
      <% if (hasReadAccess) { %> checked <% } %>
      <% if (!canChangeReadAccess) { %>disabled="disabled"<% } %>
    />
    <span class="u-iBlock CDB-ToggleFace"></span>
    <label class="u-iBlock u-altTextColor "><%- _t('components.modals.publish.share.toggle.read') %></label>
  </div>
</div>