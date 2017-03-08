# This should be included in every controller using the following CARTO layouts:
# - application
module CartoGearsApi
  module GearControllerHelper
    include SafeJsObject
    include CartoDB::ConfigUtils
    include TrackjsHelper
    include GoogleAnalyticsHelper
    include HubspotHelper
  end
end
