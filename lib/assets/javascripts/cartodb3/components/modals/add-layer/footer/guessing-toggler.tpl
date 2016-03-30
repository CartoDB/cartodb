<% if (importState !== "twitter") { %>
  <div class="js-toggle Checkbox">
    <div class="u-iBlock CDB-Text CDB-Size-large u-rSpace--xl">
      <input class="CDB-Checkbox js-toggle" type="checkbox" <%- isGuessingEnabled ? 'checked' : '' %>>
      <span class="u-iBlock CDB-Checkbox-face"></span>
      <label class="u-iBlock u-lSpace"><%- _t('components.modals.add-layer.footer.guessing-desc') %></label>
    </div>
  </div>
<% } else if (!customHosted) { %>
  <%- _t('components.modals.add-layer.footer.twitter-desc') %>
  <a href="mailto:support@cartodb.com"><%- _t('components.modals.add-layer.footer.contact-team') %></a>
<% } %>
