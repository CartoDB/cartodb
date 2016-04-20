<form>
  <fieldset>
    <% _.each(fields, function(field, i) { %>
      <div class="CDB-Text CDB-Fieldset <% if (i > 0) { %>u-tSpace-xl<% } %>">
        <div class="CDB-Legend CDB-Legend--withcheck u-ellipsis u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m">
          <div class="CDB-Shape">
            <div class="CDB-Shape-rectsHandle is-small">
              <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-first"></div>
              <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-second"></div>
              <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-third"></div>
            </div>
          </div>

          <input class="CDB-Checkbox" type="checkbox" name="field" value="<%- field.get('name') %>">
          <span class="u-iBlock CDB-Checkbox-face u-rSpace--m"></span>
          <label class="CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- field.get('name') %></label>
        </div>
        <input type="text" name="text" placeholder="<%- field.get('name') %>" class="CDB-InputText">
      </div>
    <% }); %>
  </fieldset>
</form>
