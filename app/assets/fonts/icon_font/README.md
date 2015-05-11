How to make changes in the CartoDB icon font
--------------------------------------------

If you want to edit, add or remove any icon in our new CartoDB font, you should follow these steps:

- Check you have [Sketch](http://bohemiancoding.com/sketch/) last version.
- Open [font.sketch](http://github.com/CartoDB/cartodb/blob/master/app/assets/fonts/icon_font/font.sketch) file and make your changes


### Rules for your new icons:
- Size should have at max 500px of width/height.
- Place the icon accordingly with the grid.
- Icons should be completely black.
- Group the icon if it has several parts.
- Make icons exportable to SVG.
- Name your icon (layer/group) according to the pattern `icon-font_xx_Name`, where xx is a unique integer (increase it for each new icon).
  
  
### When you're done with changes
- Select all icons, and export them to `app/assets/fonts/icon_font/svgs` folder (option should be visible in the bottom corner in your Sketch app):
  - ![screen shot 2015-01-16 at 11 40 36](https://cloud.githubusercontent.com/assets/978461/5774986/93dc90e8-9d74-11e4-8064-a478e55d392b.png)
  - Take into account that ```svgs``` folder is ignored.
- Open your terminal app and go to the CartoDB root folder.
- Install your node dependencies: `npm install`
- Now we will generate the new icon fonts + stylesheet. Just run: `./node_modules/.bin/gulp`
- Check that your `icon-font.css.scss` and the `cartoIcon` fonts have been edited: 
  - ![screen shot 2015-01-16 at 11 02 53](https://cloud.githubusercontent.com/assets/978461/5775004/acf10faa-9d74-11e4-893c-790da626d894.png)

All done!
