<div class="js-iconSelector">
    <div class="FormAccount-rowLabel">
      <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor">App icon</label>
    </div>
    <div class="FormAccount-rowData FormAccount-avatar">
      <div class="FormAccount-avatarPreview">
        <% if (iconURL == null) { %>
          <div class="FormAccount-inputIcon--noIcon">No icon</div>
        <% } else { %>
          <img src="<%- iconURL %>" title="<%- name %>" alt="<%- name %>" class="FormAccount-avatarPreviewImage" />
        <% } %>
        <% if ( state === "loading" ) { %>
          <div class="FormAccount-avatarPreviewLoader">
            <div class="Spinner FormAccount-avatarPreviewSpinner"></div>
          </div>
        <% } %>
      </div>
      <input class="js-fileIcon" type="file" value="Choose image" accept="<%- iconAcceptedExtensions %>" />
      <input class="js-inputIcon" id="mobile_app_icon_url" name="<%- inputName %>" type="hidden" value="<%- iconURL %>" />
      <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft">
        <% if (state === "error") { %>
          <p class="FormAccount-rowInfoText FormAccount-rowInfoText--error FormAccount-rowInfoText--maxWidth">There was an error uploading the icon. Check the height and size (max 1MB) of the image</p>
        <% } else { %>
          <p class="FormAccount-rowInfoText FormAccount-rowInfoText--smaller">Recommended images should be 128x128 pixels of size</p>
        <% } %>
      </div>
    </div>
  </div>
