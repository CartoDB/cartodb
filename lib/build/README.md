
# how to build frontend assets

- install node (0.10.x) recommended
- install dependencies:
```
npm install
```
- execute grunt
```
grunt
```

the assets are created in `public/assets/:version/` and after this you can run rails app as always


### troubleshooting

* **After running ```grunt```I get this error**: 

    > Errno::ENOENT on line ["33"] of /Users/username/.rvm/gems/ruby-1.9.3-p194/gems/compass-0.12.3/lib/compass/exec/global_options_parser.rb: No such file or directory - /Users/username/code/cartoDB/app/assets/stylesheets/tmp/common (

   **Solution**: update your CartoDB git submodules running: ```git submodule update --init```
