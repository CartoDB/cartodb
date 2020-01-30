<select name="billing-project" class="ImportOptions__input--long Form-inputField Form-inputField--withLabel CDB-Text CDB-Size-medium">
  <option value=""></option>
  <% options.forEach(function (option) { %>
    <option value="<%- option.id %>"><%- option.friendly_name %></option>
  <% }); %>
</select>
