<div class="CodeMirror-editor">
  <textarea class="js-editor"><%- content %></textarea>
</div>

<div class="js-warning">
  Warning Text
</div>

<% if (tips) { %>
<div class="CodeMirror-console js-console">
  <%- tips %>
  <div class="js-console-error"></div>
</div>
<% } %>
