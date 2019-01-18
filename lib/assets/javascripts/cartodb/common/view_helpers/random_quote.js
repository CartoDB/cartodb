/**
 * Random quote
 */
module.exports = function() {

  var template  = _.template('<p class="CDB-Text CDB-Size-medium u-altTextColor">"<%= quote %>"</p><% if (author) { %><p class="CDB-Text CDB-Size-medium u-altTextColor u-tSpace"><em>– <%- author %></em></p><% } %>');

  var quotes = [
    { quote: "Geographers never get lost. They just do accidental field work.", author: "Nicholas Chrisman" },
    { quote: "Geography is just physics slowed down, with a couple of trees stuck in it.", author: "Terry Pratchett" },
    { quote: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
    { quote: "In that Empire, the Art of Cartography attained such Perfection that the map of a single Province occupied the entirety of a City.", author: "Jorge Luis Borges" },
    { quote: "X marks the spot", author: "Indiana Jones" },
    { quote: "It's turtles all the way down.", author: null },
    { quote: "Remember: no matter where you go, there you are.", author: null },
    { quote: "Without geography, you're nowhere!", author: "Jimmy Buffett" },
    { quote: "our earth is a globe / whose surface we probe /<br />no map can replace her / but just try to trace her", author: "Steve Waterman" },
    { quote: "Everything happens somewhere.", author: "Doctor Who" },
    { quote: "A map is the greatest of all epic poems. Its lines and colors show the realization of great dreams.", author: "Gilbert H. Grosvenor" },
    { quote: "Everything is related to everything else,<br />but near things are more related than distant things.", author: "Tobler's first law of geography" },
    { quote: "Hic Sunt Dracones", author: null },
    { quote: "Here be dragons", author: null },
    { quote: "Stand in the place where you live / Now face North /<br/>Think about direction / Wonder why you haven't before", author: "R.E.M" },
    { quote: "The virtue of maps, they show what can be done with limited space, they foresee that everything can happen therein.", author: "José Saramago" }
  ];

  var r = Math.round(Math.random() * (quotes.length - 1));

  return template(quotes[r]);
};
