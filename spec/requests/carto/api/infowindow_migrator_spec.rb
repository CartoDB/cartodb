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
    let(:carto_layer) do
      FactoryGirl.build(:carto_layer, infowindow: infowindow, tooltip: tooltip)
    end

    let(:tiled_layer) do
      FactoryGirl.build(:carto_tiled_layer, infowindow: infowindow, tooltip: tooltip)
    end

    it 'sets template_name "none" if fields are empty' do
      migrated = migrator.migrate_builder_infowindow(carto_layer)
      migrated['template_name'].should eq 'none'
      migrated['template'].should eq ''

      migrated = migrator.migrate_builder_tooltip(carto_layer)
      migrated['template_name'].should eq 'none'
      migrated['template'].should eq ''
    end

    it 'returns nil if nil is passed and kind is tiled' do
      tiled_layer.infowindow = nil
      migrated = migrator.migrate_builder_infowindow(tiled_layer)
      migrated.should be_nil
    end

    let(:default_infowindow) do
      {
        "fields" => [],
        "template_name" => "none",
        "template" => "",
        "alternative_names" => {},
        "width" => 226,
        "maxHeight" => 180
      }
    end

    it 'returns the default infowindow if parameter is nil and layer_kind is carto' do
      carto_layer.infowindow = nil
      migrated = migrator.migrate_builder_infowindow(carto_layer)
      migrated.should_not be_nil
      migrated.should eq default_infowindow
    end

    it 'returns the alternate for data layers without infowindow' do
      carto_layer.infowindow = nil
      alternate = { 'template' => { wadus: true } }
      migrated = migrator.migrate_builder_infowindow(carto_layer, alternate)
      migrated.should eq alternate
    end
  end
end
