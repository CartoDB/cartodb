const tests = require.context('./', true, /.spec.js$/);
tests.keys().forEach(tests);
