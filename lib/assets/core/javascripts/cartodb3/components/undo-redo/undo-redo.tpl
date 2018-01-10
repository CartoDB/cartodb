<div class="u-flex u-alignCenter">
  <button class="js-undo">
    <i class="CDB-IconFont CDB-IconFont-undo Size-large u-actionTextColor js-theme <% if (!canUndo) { %>is-disabled<% } %>"></i>
  </button>

  <button class="u-lSpace--xl js-redo">
    <i class="CDB-IconFont CDB-IconFont-redo Size-large u-actionTextColor js-theme <% if (!canRedo) { %>is-disabled<% } %>"></i>
  </button>

  <% if (canClear) { %>
  <button class="u-lSpace--xl CDB-Button CDB-Button--secondary CDB-Button--white js-clear">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small"><%- _t('components.undo-redo.clear') %></span>
  </button>
  <% } %>

  <% if (canApply) { %>
  <button class="u-lSpace--xl CDB-Button CDB-Button--loading CDB-Button--primary js-apply
    <% if (isLoading) {%> is-loading is-disabled<% } %>
    <% if (isDisabled) {%> is-disabled<% } %>
  ">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small"><%- _t('components.undo-redo.apply') %></span>
    <div class="CDB-Button-loader CDB-LoaderIcon is-white">
      <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
      </svg>
    </div>
  </button>
  <% } %>
</div>
