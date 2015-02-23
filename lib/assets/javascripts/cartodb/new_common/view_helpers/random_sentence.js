/**
 * Random sentence
 */
module.exports = function() {

  var template  = _.template('"<%= sentence %>"<% if (author) { %> <%= author %>.<% } %>');

  var sentences = [
    { sentence: "Geographers never get lost. They just do accidental field work.", author: "Nicholas Chrisman" },
    { sentence: "Geography is just physics slowed down, with a couple of trees stuck in it.", author: "Terry Pratchett" },
    { sentence: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
    { sentence: "In that Empire, the Art of Cartography attained such Perfection that the map of a single Province occupied the entirety of a City.", author: "Jorge Luis Borges" },
    { sentence: '"X" marks the spot', author: "Indiana Jones" },
    { sentence: "It's turtles all the way down.", author: null },
    { sentence: "Remember: no matter where you go, there you are.", author: null },
    { sentence: "Without geography, you're nowhere!", author: "Jimmy Buffett" },
    { sentence: "our earth is a globe / whose surface we probe / no map can replace her / but just try to trace her", author: "Steve Waterman" },
    { sentence: "Everything happens somewhere.", author: "Doctor Who" },
    { sentence: "A map is the greatest of all epic poems. Its lines and colors show the realization of great dreams.", author: "Gilbert H. Grosvenor" },
    { sentence: "Everything is related to everything else, but near things are more related than distant things.", author: "Tobler's first law of geography" },
    { sentence: "Hic Sunt Dracones", author: null },
    { sentence: "Here be dragons", author: null },
    { sentence: "Stand in the place where you live / Now face North / Think about direction / Wonder why you haven't before from Stand", author: "R.E.M" },
    { sentence: "Look to the future & leave the past behind", author: "@xavijam" }
  ];

  var r = Math.round(Math.random() * (sentences.length - 1));

  return template(sentences[r]);
};
