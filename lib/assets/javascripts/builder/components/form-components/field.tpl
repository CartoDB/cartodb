<div class="CDB-Text Editor-formInner<% if (type){ %> Editor-formInner--<%- type %><% } %>">
  <% if (title) { %>
    <label class="CDB-Legend <% if (editorType){ %> CDB-Legend--<%- editorType %><% } %> u-upperCase CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>" title="<%- title %>">
      <div class="u-ellipsis <% if (help) { %>Editor-formHelp<% } %>">
        <span class="<% if (help) { %> js-help is-underlined<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> ><%- title %></span>
      </div>
    </label>
  <% } %>
  <div class="Editor-formInput u-flex u-alignCenter" data-editor>
    <% if (isCopyButtonEnabled) { %>
      <button type="button" class="Share-copy CDB-Button CDB-Button--small js-copy" data-clipboard-target="#<%- editorId %>">
        <span class="CDB-Button-Text CDB-Text CDB-Size-small u-actionTextColor"><%- _t('components.backbone-forms.copy-button') %></span>
      </button>
    <% } %>
  </div>
</div>
