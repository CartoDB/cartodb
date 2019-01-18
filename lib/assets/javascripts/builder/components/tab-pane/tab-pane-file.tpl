<% if (type === 'text') { %>
<%- label %><% if (selectedChild) { %> <span class="CDB-NavSubmenu-status js-NavSubmenu-status u-hintTextColor"><%- selectedChild %></span><% } %>
<% } else if (kind === 'custom-marker') { %>
<div class='Editor-categoryImagesTag CDB-Text CDB-FontSize-small u-altTextColor is-semibold u-upperCase'><%- _t('form-components.editors.fill.input-color.img') %></div>
<% } else { %>
<div class="Tab-paneLabelImageContainer js-image-container"></div>
<% } %>
