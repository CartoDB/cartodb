require_relative '../../../spec_helper_min'
require_relative '../../../../lib/carto/carto_geopkg/metadata_tools'
require_relative '../../../factories/carto_visualizations'

describe Carto::CartoGeoPKG::MetadataTools do
  include Carto::CartoGeoPKG::MetadataTools,
          Carto::Factories::Visualizations

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    @user.destroy
  end

  describe('@HashGenerator') do
    before(:all) do
      @generator = Carto::CartoGeoPKG::MetadataTools::HashGenerator.new
    end

    after(:all) do
      @generator = nil
    end

    describe('#source_for_visualization') do
      it 'should return nil when no sync is present' do
        @generator.source_for_visualization(@table_visualization).should be_nil
      end

      it 'should return a sync type source for synchronizations' do
        sync = FactoryGirl.build(:carto_synchronization)
        @table_visualization.synchronization = sync

        source_json = @generator.source_for_visualization(@table_visualization)
        source_json.should_not be_empty
        source_json[:type].should eq 'sync'

        sync_json_config = source_json[:configuration]
        sync_json_config.should_not be_empty
        sync_json_config[:refresh_interval_in_seconds].should eq sync.interval
        sync_json_config[:url].should eq sync.url

        @table_visualization.synchronization = nil
      end
    end

    describe('#schema_for_table_schema') do
      let(:table_schema) do
        [
          [:cartodb_id, 'number'],
          [:the_geom, 'geometry', 'geometry', 'polygon'],
          [:column_a, 'text'],
          [:column_b, 'float']
        ]
      end

      let(:expected_schema) do
        {
          cartodb_id: { type: 'number' },
          the_geom: { type: 'polygon' },
          column_a: { type: 'text' },
          column_b: { type: 'float' }
        }
      end

      it 'should return a valid schema hash' do
        @generator.schema_for_table_schema(table_schema).should eq expected_schema
      end
    end
  end

  describe('#visualization_to_json') do
    let(:tags) { ['amazing', 'new', 'table'] }
    let(:description) { 'Every thing about this table is cool.' }
    let(:attributions) { 'CARTO, Bloomberg' }
    let(:schema) do
      {
        cartodb_id: { type: "integer" },
        the_geom: { type: "geometry" },
        description: { type: "text" },
        name: { type: "text" }
      }
    end

    it 'should return a valid hash' do
      @table_visualization.description = description
      @table_visualization.tags = tags
      @table_visualization.attributions = attributions

      json = visualization_to_json(@table_visualization)

      json.should_not be_empty

      json_data = json[:data]
      json_data.should_not be_empty
      json_data[:source].should be_nil

      json_information = json[:information]
      json_information.should_not be_empty
      json_information[:vendor].should eq 'carto'
      json_information[:version].should eq '0.0.1'
      json_information[:name].should_not be_nil
      json_information[:description].should eq description
      json_information[:attributions].should eq attributions
      json_information[:created_at].should_not be_nil

      json_classification = json_information[:classification]
      json_classification.should_not be_empty
      json_classification[:tags].should eq tags

      json_publishing = json[:publishing]
      json_publishing.should_not be_empty
      json_publishing[:privacy].should eq @table_visualization.privacy

      json[:schema].should eq schema

      @table_visualization.description = nil
      @table_visualization.tags = nil
    end
  end
end
