var testsContext = require.context('./', true, /\.js$/);
testsContext.keys().forEach(testsContext);
