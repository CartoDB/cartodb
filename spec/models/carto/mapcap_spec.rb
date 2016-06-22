# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Mapcap do
  include Carto::Factories::Visualizations

  before(:all) do
    @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

    @map, _, _, @visualization = create_full_visualization(@user)
  end

  after(:all) do
    @map.destroy
    @user.destroy
  end

  describe 'with layers' do
    before(:all) do
      @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
      @visualization.reload

      @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
    end

    after(:all) do
      @mapcap.destroy
      @carto_layer.destroy
      @visualization.reload
    end

    describe '#ids_vizjson' do
      before(:all) do
        @ids_json_layers = @mapcap.ids_json[:layers]
      end

      after(:all) do
        @ids_json_layers = nil
      end

      it 'should not have empty layers' do
        @ids_json_layers.should_not be_empty
      end

      it 'should contain layer ids' do
        @ids_json_layers.count.should eq @visualization.layers.count

        @ids_json_layers.each_with_index do |layer, index|
          layer.keys.first.should eq @visualization.layers[index].id
        end
      end
    end

    describe '#populate_ids' do
    end

    describe '#regenerate_visualization' do
    end
  end
end
