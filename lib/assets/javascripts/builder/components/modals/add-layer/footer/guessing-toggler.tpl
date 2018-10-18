<% if (importState !== "twitter") { %>
  <div class="u-iBlock CDB-Text CDB-Size-medium u-rSpace--xl js-toggle">
    <input class="CDB-Checkbox" type="checkbox" <%- isGuessingEnabled ? 'checked' : '' %>>
    <span class="u-iBlock CDB-Checkbox-face"></span>
    <label class="u-iBlock u-lSpace"><%- _t('components.modals.add-layer.footer.guessing-desc') %></label>
  </div>
<% } else if (isTwitterDeprecatedForUser) { %>
  <div class="CDB-Text CDB-Size-medium">
    <span class="Dialog-footerWarning">
      <%- _t('components.modals.add-layer.footer.deprecated-connector') %>
    </span>
    <%= _t('components.modals.add-layer.footer.twitter-contact-support') %>
  </div>
<% } else if (!customHosted) { %>
  <span class="CDB-Text CDB-Size-medium">
    <%- _t('components.modals.add-layer.footer.twitter-how-to-historical') %>
    <a href="mailto:support@carto.com">
      <%- _t('components.modals.add-layer.footer.contact-team') %>
    </a>
  </span>
<% } %>
