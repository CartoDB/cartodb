<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-trash"></i>
    <% if (numOfIcons > 0) { %>
    <span class="Badge Badge--negative Dialog-headerIconBadge CDB-Text CDB-Size-small"><%- numOfIcons %></span>
    <% } %>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    <%= _t('dashboard.views.organization.icon_picker.deleting_icons', {smart_count: numOfIcons}) %>
  </h4>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <%= _t('dashboard.views.organization.icon_picker.once_deleted') %>
    <%= _t('dashboard.views.organization.icon_picker.maps_affected', {smart_count: numOfIcons}) %>
  </p>
  <p class="CDB-Text CDB-Size-medium u-altTextColor"><%= _t('dashboard.views.organization.icon_picker.be_sure') %></p>
</div>

<div class="Dialog-footer Dialog-footer--simple u-inner">
  <div class="Dialog-footerContent">
    <button class="CDB-Button CDB-Button--secondary js-cancel">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.cancel') %></span>
    </button>
    <button class="u-lSpace--xl CDB-Button CDB-Button--error js-submit">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.organization.icon_picker.delete') %></span>
    </button>
  </div>
</div>
