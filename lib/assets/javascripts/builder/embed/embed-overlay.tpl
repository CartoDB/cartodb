<div class="CDB-Legends-canvas">
  <div class="CDB-Legends-canvasInner">
    <div class="CDB-Embed-title u-bSpace--xl">
      <div class="CDB-Overlay-title">
        <h1 class="CDB-Text CDB-Size-large u-ellipsis" title="<%= title %>"><%= title %></h1>

        <% if (description) { %><div class="CDB-Overlay-options">
          <button class="CDB-Shape js-toggle u-lSpace">
            <div class="CDB-ArrowToogle is-blue <% if (!collapsed) { %>is-down<% } %> is-mini"></div>
          </button>
        </div><% } %>
      </div>

      <% if (description) { %><div class="CDB-Overlay-inner <% if (!collapsed) { %>is-active<% } %>">
        <div class="CDB-Embed-description CDB-Text CDB-Size-medium u-altTextColor" title="<%= description %>"><%= description %></div>
      </div><% } %>
    </div>
  </div>
</div>
