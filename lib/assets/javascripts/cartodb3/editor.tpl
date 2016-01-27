<ul>
  <li><%- cdb.T('editor.map') %></li>
  <li><%- cdb.T('editor.map_name', { name: "Hello" }) %></li>
  <li><%= cdb.T('editor.map_pluralize', { smart_count: 1 }) %></li>
  <li><%= cdb.T('editor.map_pluralize', 2) %></li>
</ul>
