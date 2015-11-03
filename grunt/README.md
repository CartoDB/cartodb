## Grunt tasks list

These are the tasks(*) we provide:

- [x] ```grunt publish```     => publish CartoDB.js library in S3 (you need secret keys).
- [x] ```grunt release```     => same as publish task.
- [x] ```grunt clean```       => clean temporary and dist folders.
- [x] ```grunt invalidate```  => invalidate library files through fastly.
- [x] ```grunt test```        => run library test suite in the console (it will generate a SpecRunner.html file in test folder).
  - ```grunt test -d```       => if you need to print failing tests.
  - ```grunt test -f```       => if you need to know where was the problem.
- [x] ```grunt build```       => generate library in dist folder.
- [X] ```grunt build:js```    => create uncompressed javascript files in dist (useful for developing)
- [X] ```grunt build:css```   => create uncompressed stylesheets files in dist (useful for developing)

Dev tasks are as useful while in development, watches files and updates the bundles accordingly:
- [x] ```grunt dev:js```      => only JS
- [x] ```grunt dev:css```     => only CSS
- [x] ```grunt dev```         => both JS and CSS

*Remember to install all the things you need, check main README.md, how to build section.
