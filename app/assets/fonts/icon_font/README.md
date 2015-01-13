How to make changes in the CartoDB icon font
--------------------------------------------

If you want to edit, add or remove any icon in our new CartoDB font, you should follow these steps:

- Check you have [Sketch](http://bohemiancoding.com/sketch/) last version.
- Open [font.sketch](http://github.com/CartoDB/cartodb/blob/master/app/assets/fonts/icon_font/font.sketch) file and make your changes:
- Advices for your new icons:
  - Size should have at max 500px of width/height.
  - Place the icon accordingly with the grid.
  - Icons should be completely black.
  - Group the icon if it has several parts.
  - Make icons exportable to SVG.
  - Remember to name your icons properly: icon-font_xx_Name (where xx is an integer, add up one for new ones).
- When your icons are ready, select all and export them to `app/assets/fonts/icon_font/svgs` folder (option should be visible in the bottom corner in your Sketch app).
- Open your terminal app and go to the CartoDB folder.
- Install your node dependencies: `npm install`
- Now we will generate the new icon fonts + stylesheet. Just run: `gulp`
- Check that your `icon-font.css.scss` and the `cartoIcon` fonts have been edited.

All done!
