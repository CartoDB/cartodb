require_dependency 'carto_gears_api/pages/subheader'

module PagesHelper
  def pages_subheader_instance
    CartoGearsApi::Pages::Subheader.instance
  end
end

