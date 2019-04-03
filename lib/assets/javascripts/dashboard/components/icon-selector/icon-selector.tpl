<div class="js-iconSelector">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%= _t('dashboard.components.icon_selector.icon_selector.app_icon') %></label>
    </div>
    <div class="FormAccount-rowData FormAccount-avatar">
      <div class="FormAccount-avatarPreview">
        <% if (iconURL == null) { %>
          <div class="FormAccount-inputIcon--noIcon"><%= _t('dashboard.components.icon_selector.icon_selector.no_icon') %></div>
        <% } else { %>
          <img src="<%- iconURL %>" title="<%- name %>" alt="<%- name %>" class="FormAccount-avatarPreviewImage" />
        <% } %>
        <% if ( state === "loading" ) { %>
          <div class="FormAccount-avatarPreviewLoader">
            <div class="Spinner FormAccount-avatarPreviewSpinner"></div>
          </div>
        <% } %>
      </div>
      <input class="js-fileIcon" type="file" value=<%= _t('choose_image') %> accept="<%- iconAcceptedExtensions %>" />
      <input class="js-inputIcon" id="mobile_app_icon_url" name="<%- inputName %>" type="hidden" value="<%- iconURL %>" />
      <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
        <% if (state === "error") { %>
          <p class="FormAccount-rowInfoText FormAccount-rowInfoText--error FormAccount-rowInfoText--maxWidth"><%= _t('dashboard.components.icon_selector.icon_selector.err_upload') %></p>
        <% } else { %>
          <p class="FormAccount-rowInfoText FormAccount-rowInfoText--smaller"><%= _t('dashboard.components.icon_selector.icon_selector.rec_size') %></p>
        <% } %>
      </div>
    </div>
  </div>
