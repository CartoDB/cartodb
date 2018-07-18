# Rails 3.2.10 changed the way JSON parameters are processed, causing empty arrays be changed to nil.
# The oauth-plugin gem version 0.5.0 adds two changes:
# - Rails 4 support (that we want)
# - A filter for invalid tokens (that we don't want, since it interferes with x_auth)
#
# This patch puts Rails 4 support into an older version of the gem (0.4.1)

module OAuth
  module Controllers
    module ApplicationControllerMethods
      class Filter
        alias :before, :filter
      end
    end
end
end
