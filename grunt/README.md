## Grunt tasks list

These are the tasks(*) we provide:

[X] ```grunt serve```       => serve static cartodb.js landing page.
[X] ```grunt publish```     => publish cartodb.js library in S3 (you need secret keys).
[X] ```grunt release```     => same as publish task.
[X] ```grunt clean```       => clean temporary and dist folders.
[X] ```grunt invalidate```  => invalidate library files through fastly.
[X] ```grunt test```        => run library test suite (it will generate a SpecRunner.html file in test folder).
[X] ```grunt build```       => generate library and website in dist folder.
[X] ```grunt dist```        => same as build task.
[X] ```grunt pages```       => deploy static cartodb.js webpage to gh-pages.
[ ] ```grunt watch```       => special watch for cartodb.js library (in progress).

*Remember to install all the things you need, check main README.md, how to build section.