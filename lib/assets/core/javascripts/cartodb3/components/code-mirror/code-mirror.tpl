<div class="CodeMirror-editor">
  <textarea class="js-editor"><%- content %></textarea>
</div>

<% if (tip) { %>
<div class="CodeMirror-console js-console">
  <%- tip %>
  <div class="js-console-error"></div>
</div>
<% } %>