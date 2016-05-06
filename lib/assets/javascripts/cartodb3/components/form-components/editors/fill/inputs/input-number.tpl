<% if (type === 'value')  { %>
<input type="text" class="CDB-InputText InputFillText js-input" value="<%- min %>..<%- max %>" />
<% } else { %>
<input type="text" class="CDB-InputText InputFillText js-input" value="<%- value %>" />
<% } %>
