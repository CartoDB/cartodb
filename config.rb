# Compass configuration, used by cartodb UI grunt task.
# Require any additional compass plugins here.

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "dist/css"
sass_dir = "tmp/sass/editor"
images_dir = "app/assets/images/"
#javascripts_dir = "lib/assets/javascripts"

# You can select your preferred output style here (can be overridden via the command line):
output_style = :compact

# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
line_comments = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass

Encoding.default_external = "utf-8"
