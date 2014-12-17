## Grunt tasks list

These are the tasks(*) we provide:

- [x] ```grunt serve```       => serve static cartodb.js landing page.
- [x] ```grunt publish```     => publish cartodb.js library in S3 (you need secret keys).
- [x] ```grunt release```     => same as publish task.
- [x] ```grunt clean```       => clean temporary and dist folders.
- [x] ```grunt invalidate```  => invalidate library files through fastly.
- [x] ```grunt test```        => run library test suite (it will generate a SpecRunner.html file in test folder).
- [x] ```grunt build```       => generate library and website in dist folder.
- [x] ```grunt dist```        => same as build task.
- [x] ```grunt pages```       => deploy static cartodb.js webpage to gh-pages.
- [ ] ```grunt watch```       => special watch for cartodb.js library (in progress).

*Remember to install all the things you need, check main README.md, how to build section.
