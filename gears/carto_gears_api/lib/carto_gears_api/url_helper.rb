module CartoGearsApi
  module UrlHelper
    # @param context [ActionController::Base]
    # @param path [String] path name defined at the current Gear.
    def carto_gear_path(context, path)
      CartoDB.path(context, path)
    end

    # @param context [ActionController::Base]
    # @param path [String] path name defined at main CartoDB.
    def carto_path(context, path)
      CartoDB.path(context.main_app, path)
    end
  end
end
