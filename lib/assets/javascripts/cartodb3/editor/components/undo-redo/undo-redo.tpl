<button>
  <i class="CDB-IconFont CDB-IconFont-undo Size-large u-actionTextColor js-undo js-theme <% if (!canUndo) { %>is-disabled<% } %>"></i>
</button>
<button class="u-lSpace--xl">
  <i class="CDB-IconFont CDB-IconFont-redo Size-large u-actionTextColor js-redo js-theme <% if (!canRedo) { %>is-disabled<% } %>"></i>
</button>
<% if (canCancel) { %>
<button class="u-lSpace--xl CDB-Button CDB-Button--secondary CDB-Button--small js-cancel">
  <span class="CDB-Text is-semibold CDB-Size-small"><%- _t('components.undo-redo.cancel') %></span>
</button>
<% } %>
<% if (canApply) { %>
<button class="u-lSpace--xl CDB-Button CDB-Button--primary CDB-Button--small js-apply">
  <span class="CDB-Text is-semibold CDB-Size-small"><%- _t('components.undo-redo.apply') %></span>
</button>
<% } %>
