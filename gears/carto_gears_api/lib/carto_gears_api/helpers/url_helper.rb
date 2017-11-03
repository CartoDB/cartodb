module CartoGearsApi
  module Helpers
    module UrlHelper
      # @param gear [Symbol] Gear name.
      # @param context [ActionController::Base]
      # @param path [String] path name defined at the current Gear.
      def carto_gear_path(gear, context, path, params = {})
        callable_context = context.respond_to?(gear) ? context.send(gear) : context
        CartoDB.path(callable_context, path, params)
      end

      # @param context [ActionController::Base]
      # @param path [String] path name defined at main CartoDB.
      def carto_path(context, path, params = {})
        CartoDB.path(context.main_app, path, params)
      end
    end
  end
end
