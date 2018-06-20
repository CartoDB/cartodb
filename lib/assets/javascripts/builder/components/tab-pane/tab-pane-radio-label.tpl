<input id="<%- customId %>" class="CDB-Radio" type="radio" value="<%- name %>" <% if (selected) { %> checked <% } %> />
<span class="u-iBlock CDB-Radio-face"></span>     
<label for="<%- customId %>" class="u-iBlock u-lSpace CDB-Text CDB-Size-medium <% if (help) { %>js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> >
    <%- label %>
</label>
<% if (selectedChild) { %> <span class="CDB-NavSubmenu-status js-NavSubmenu-status u-hintTextColor"><%- selectedChild %></span><% } %>