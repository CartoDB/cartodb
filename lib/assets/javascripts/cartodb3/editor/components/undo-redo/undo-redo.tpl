<button class="u-actionTextColor js-undo <% if (!canUndo) { %>is-disabled<% } %>">
  <i class="CDB-IconFont CDB-IconFont-undo Size-large"></i>
</button>
<button class="u-actionTextColor u-lSpace--xl js-redo <% if (!canRedo) { %>is-disabled<% } %>">
  <i class="CDB-IconFont CDB-IconFont-redo Size-large"></i>
</button>
<% if (canApply) { %>
<button class="CDB-Button CDB-Button--primary CDB-Button--small js-apply">
  <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small">APPLY</span>
</button>
<% } %>
