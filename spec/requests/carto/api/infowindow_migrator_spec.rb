require_relative '../../../spec_helper_min'
require_dependency 'carto/api/infowindow_migrator'

describe Carto::Api::InfowindowMigrator do
  class TestInfowindowMigrator
    include Carto::Api::InfowindowMigrator
  end

  let(:migrator) { TestInfowindowMigrator.new }
  let(:infowindow) do
    {
      "fields" => [],
      "template_name" => "table/views/infowindow_light",
      "template" => "",
      "alternative_names" => {},
      "width" => 226,
      "maxHeight" => 180
    }
  end
  let(:tooltip) do
    {
      "fields" => [],
      "template_name" => "tooltip_light",
      "template" => "",
      "alternative_names" => {},
      "maxHeight" => 180
    }
  end

  describe '#migrate_builder_infowindow' do
    it 'sets template_name "none" if fields are empty' do
      migrated = migrator.migrate_builder_infowindow(infowindow)
      migrated['template_name'].should eq 'none'
      migrated['template'].should eq ''

      migrated = migrator.migrate_builder_infowindow(tooltip)
      migrated['template_name'].should eq 'none'
      migrated['template'].should eq ''
    end
  end
end
