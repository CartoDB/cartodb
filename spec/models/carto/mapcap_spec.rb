# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Mapcap do
  include Carto::Factories::Visualizations

  before(:all) do
    @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)

    @user.destroy
  end

  describe '#ids_vizjson' do
    before(:all) do
      @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
      @ids_json = @mapcap.ids_json
    end

    after(:all) do
      @mapcap.destroy
      @ids_json = nil
    end

    it 'should have visualization_id' do
      @ids_json[:visualization_id].should_not be_nil
    end

    it 'should have map_id' do
      @ids_json[:map_id].should_not be_nil
    end

    it 'should have correct visualization_id' do
      @ids_json[:visualization_id].should eq @visualization.id
    end

    it 'should have correct map_id' do
      @ids_json[:map_id].should eq @map.id
    end

    describe 'with layers' do
      before(:all) do
        @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
        @visualization.reload

        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
        @ids_json_layers = @mapcap.ids_json[:layers]
      end

      after(:all) do
        @mapcap.destroy
        @carto_layer.destroy
        @visualization.reload

        @ids_json_layers = nil
      end

      it 'should not have empty layers' do
        @ids_json_layers.should_not be_empty
      end

      it 'should contain layer ids and in the right order' do
        @ids_json_layers.count.should eq @visualization.layers.count

        @ids_json_layers.each_with_index do |layer, index|
          layer[:layer_id].should eq @visualization.layers[index].id
        end
      end

      describe 'with widgets' do
        before(:all) do
          @widget = FactoryGirl.create(:widget, layer: @carto_layer)
          @visualization.reload

          @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
          @ids_json_layers = @mapcap.ids_json[:layers]
        end

        after(:all) do
          @widget.destroy
          @visualization.reload
          @mapcap.destroy
          @ids_json_layers = nil
        end

        it 'should contain widgets only for layers with widgets and in the right order' do
          @visualization.layers.each_with_index do |layer, index|
            @ids_json_layers[index][:widgets].each_with_index do |widget_id, widget_index|
              widget_id.should eq layer.widgets[widget_index].id
            end
          end
        end
      end
    end
  end

  describe '#regenerate_visualization' do
    before(:all) do
      @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
      @regenerated_visualization = @mapcap.regenerate_visualization
    end

    after(:all) do
      @mapcap.destroy
      @ids_json = nil
      @regenerated_visualization = nil
    end

    it 'should preserve map' do
      @regenerated_visualization.map.id.should eq @map.id
    end

    it 'should preserve visualization' do
      @regenerated_visualization.id.should eq @visualization.id
    end

    it 'should preserve user' do
      @regenerated_visualization.user.id.should eq @visualization.user.id
    end

    it 'should preserve permission' do
      @regenerated_visualization.permission.id.should eq @visualization.permission.id
    end

    describe 'with layers' do
      before(:all) do
        @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
        @visualization.reload

        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
        @regenerated_visualization = @mapcap.regenerate_visualization
      end

      after(:all) do
        @mapcap.destroy
        @carto_layer.destroy
        @visualization.reload
        @regenerated_visualization = nil
      end

      it 'should contain same layers in same order' do
        @regenerated_visualization.layers.each_with_index do |layer, index|
          layer.id == @regenerated_visualization.layers[index].id
        end
      end

      describe 'with widgets' do
        before(:all) do
          @widget = FactoryGirl.create(:widget, layer: @carto_layer)
          @visualization.reload

          @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
          @regenerated_visualization = @mapcap.regenerate_visualization
        end

        after(:all) do
          @widget.destroy
          @visualization.reload
          @mapcap.destroy
          @regenerated_visualization = nil
        end

        it 'should contain widgets only for layers with widgets and in the right order' do
          @visualization.layers.each_with_index do |layer, index|
            regenerated_layer = @regenerated_visualization.layers[index]

            layer.widgets.length.should eq regenerated_layer.widgets.length

            layer.widgets.each_with_index do |widget, widget_index|
              widget.should eq regenerated_layer.widgets[widget_index]
            end
          end
        end
      end
    end
  end
end
