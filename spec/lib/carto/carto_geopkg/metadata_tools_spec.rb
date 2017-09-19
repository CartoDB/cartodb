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

  describe('@JSONGenerator') do
    before(:all) do
      @generator = Carto::CartoGeoPKG::MetadataTools::JSONGenerator.new
    end

    after(:all) do
      @generator = nil
    end

    describe('#source_for_visualization') do
      it 'should return nil when no sync is present' do
        @generator.source_for_visualization(@visualization).should be_nil
      end

      it 'should return a sync type source for synchronizations' do
        sync = FactoryGirl.build(:carto_synchronization)
        @visualization.synchronization = sync

        source_json = @generator.source_for_visualization(@visualization)
        source_json.should_not be_empty
        source_json[:type].should eq 'sync'

        sync_json_config = source_json[:configuration]
        sync_json_config.should_not be_empty
        sync_json_config[:refresh_interval_in_seconds].should eq sync.interval
        sync_json_config[:url].should eq sync.url

        @visualization.synchronization = nil
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
end
