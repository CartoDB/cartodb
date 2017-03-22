require_dependency 'carto_gears_api/pages/subheader'

module CartoGearsApi
  module Helpers
    module PagesHelper
      def pages_subheader_instance
        CartoGearsApi::Pages::Subheader.instance
      end
    end
  end
end

