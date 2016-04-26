<% if (importState !== "twitter") { %>
  <div class="u-iBlock CDB-Text CDB-Size-large u-rSpace--xl js-toggle">
    <input class="CDB-Checkbox" type="checkbox" <%- isGuessingEnabled ? 'checked' : '' %>>
    <span class="u-iBlock CDB-Checkbox-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('components.modals.add-layer.footer.guessing-desc') %></label>
  </div>
<% } else if (!customHosted) { %>
  <span class="CDB-Text CDB-Size-large">
    <%- _t('components.modals.add-layer.footer.twitter-desc') %>
    <a href="mailto:support@cartodb.com"><%- _t('components.modals.add-layer.footer.contact-team') %></a>
  </span>
<% } %>
