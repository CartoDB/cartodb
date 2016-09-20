# encoding utf-8

require 'spec_helper_min'
require 'factories/carto_visualizations'

module Carto
  describe Legend do
    include Carto::Factories::Visualizations

    before(:all) do
      @user = FactoryGirl.create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      @layer = @visualization.layers.find(&:data_layer?)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @user.destroy
    end

    describe '#validations' do
      before(:all) do
        @legend = Legend.new(layer_id: @layer.id)
        @legend.valid?
      end

      after(:all) { @legend = nil }

      it 'requires a type' do
        @legend.errors[:type].should_not be_empty
      end

      it 'only accepts known types' do
        Legend::VALID_LEGEND_TYPES.split.each do |type|
          @legend.type = type
          @legend.valid?
          @legend.errors[:type].should be_empty
        end

        @legend.type = 'foo'
        @legend.valid?
        @legend.errors[:type].should_not be_empty
      end

      it 'requires a layer' do
        legend = Carto::Legend.new
        legend.stubs(:on_data_layer)
        legend.stubs(:under_max_legends_per_layer)

        legend.valid?

        legend.errors[:layer_id].should_not be_empty
      end

      it 'only accepts data layers' do
        legend = Legend.new(layer_id: @visualization.layers.first.id)
        legend.valid?

        expected_error = '\'tiled\' layers can\'t have legends'
        legend.errors[:layer_id].should include(expected_error)
      end

      it 'doesn\'t require a title' do
        @legend.errors[:title].should be_empty
      end

      it 'doesn\'t require pre_html' do
        @legend.errors[:pre_html].should be_empty
      end

      it 'doesn\'t require post_html' do
        @legend.errors[:pre_html].should be_empty
      end

      it 'requies a definition' do
        @legend.errors[:definition].should_not be_empty
        @legend.errors[:definition].should include('could not be validated')
      end

      it 'validates definition' do
        legend = Legend.new(layer_id: @layer.id, type: 'bubble', definition: {})

        legend.valid?

        legend.errors[:definition].should_not be_empty
        legend.errors[:definition].should_not include('could not be validated')
      end
    end
  end
end
