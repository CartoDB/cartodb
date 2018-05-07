<input id=<%- customId %> class="CDB-Radio" type="radio" value=<%- name %> <% if (selected) { %> checked <% } %> />
<span class="u-iBlock CDB-Radio-face"></span>     
<label for=<%- customId %> class="u-iBlock u-lSpace CDB-Text CDB-Size-medium"><%- label %></label>
<% if (selectedChild) { %> <span class="CDB-NavSubmenu-status js-NavSubmenu-status u-hintTextColor"><%- selectedChild %></span><% } %>