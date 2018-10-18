<% extraTweets = '<strong>$' + block_price/100 + '/' + block_size + ' ' + _t('components.modals.add-layer.imports.twitter.extra-tweets') + '</strong>' %>
<% if (value <= remaining) { %>
  <%- _t('components.modals.add-layer.imports.twitter.credits-left', {
    per: per,
    remainingFormatted: remainingFormatted
  }) %>
<% } else if (remaining <= 0 && !hardLimit) { %>
  <%= _t('components.modals.add-layer.imports.twitter.credits-consumed', {
    extraTweets: extraTweets
  }) %>
<% } else { %>
  <%= _t('components.modals.add-layer.imports.twitter.credits-no-limit', {
    extraTweets: extraTweets
  }) %>
<% } %>
