## Grunt tasks list

These are the tasks(*) we provide:

- [x] ```grunt serve```       => serve static CartoDB.js landing page.
- [x] ```grunt publish```     => publish CartoDB.js library in S3 (you need secret keys).
- [x] ```grunt release```     => same as publish task.
- [x] ```grunt clean```       => clean temporary and dist folders.
- [x] ```grunt invalidate```  => invalidate library files through fastly.
- [x] ```grunt test```        => run library test suite (it will generate a SpecRunner.html file in test folder).
  - ```grunt test -d```       => if you need to print failing tests.
  - ```grunt test -f```       => if you need to know where was the problem.
- [x] ```grunt build```       => generate library and website in dist folder.
- [x] ```grunt dist```        => same as build task.
- [x] ```grunt pages```       => deploy static CartoDB.js webpage to gh-pages.
- [X] ```grunt js```          => create uncompressed javascript files in dist (useful for developing)
- [x] ```grunt watch```       => special watch for cartodb.js library.
- [x] ```grunt dev```         => perfect for developing a new feature for CartoDB.js.

*Remember to install all the things you need, check main README.md, how to build section.
