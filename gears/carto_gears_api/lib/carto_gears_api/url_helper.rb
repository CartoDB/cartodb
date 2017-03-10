module CartoGearsApi
  module UrlHelper
    # @param gear [Symbol] Gear name.
    # @param context [ActionController::Base]
    # @param path [String] path name defined at the current Gear.
    def carto_gear_path(gear, context, path)
      callable_context = context.respond_to?(gear) ? context.send(gear) : context
      CartoDB.path(callable_context, path)
    end

    # @param context [ActionController::Base]
    # @param path [String] path name defined at main CartoDB.
    def carto_path(context, path)
      CartoDB.path(context.main_app, path)
    end
  end
end
