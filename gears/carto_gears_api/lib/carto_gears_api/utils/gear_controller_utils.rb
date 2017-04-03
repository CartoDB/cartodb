require_dependency 'carto_gears_api/utils/url_utils'
require_dependency 'carto_gears_api/users/users_service'

module CartoGearsApi
  module Utils
    # This should be included in every controller using the following CARTO layouts:
    # - carto_gears_api/dashboard
    # - carto_gears_api/profile
    # It's not a _helper_ to avoid automatic loading, which causes random errors with Unicorn reloads.
    # Check CartoDB/cartodb-platform/issues/3206.
    module GearControllerUtils
      include SafeJsObject
      include CartoDB::ConfigUtils
      include TrackjsHelper
      include GoogleAnalyticsHelper
      include HubspotHelper
      include FrontendConfigHelper
      include AppAssetsHelper
      include MapsApiHelper
      include SqlApiHelper
      include CartoGearsApi::Utils::UrlUtils
      include CartoGearsApi::Utils::PagesUtils

      # @return [CartoGearsApi::Users::User] Logged user, `nil` if none.
      def logged_user
        @logged_user ||= CartoGearsApi::Users::UsersService.new.logged_user(request)
      end
    end
  end
end
