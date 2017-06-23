# encoding: utf-8

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

    it 'notifies layer change on commit' do
      @layer.visualization.send(:invalidation_service).expects(:invalidate).times(3)

      legend = Legend.create!(layer: @layer,
                              type: 'bubble',
                              definition: { color: '#abc' })
      legend.update_attributes!(title: 'Cool legend')
      legend.destroy
    end

    describe '#validations' do
      before(:all) do
        @legend = Legend.new(layer_id: @layer.id)
        @legend.valid?
      end

      after(:all) { @legend = nil }

      it 'won\'t crash validation if layer is nil' do
        legend = Legend.new

        expect { legend.save }.to_not raise_error
        legend.errors.should_not be_empty
      end

      it 'requires a type' do
        @legend.errors[:type].should_not be_empty
      end

      it 'only accepts known types' do
        Legend::VALID_LEGEND_TYPES.each do |type|
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

        legend.errors[:layer].should_not be_empty
      end

      it 'only accepts data layers' do
        legend = Legend.new(layer_id: @visualization.layers.first.id)
        legend.valid?

        expected_error = '\'tiled\' layers can\'t have legends'
        legend.errors[:layer].should include(expected_error)
      end

      it 'accepts torque layers' do
        Carto::Layer.any_instance.stubs(:kind)
                    .returns('torque')
        legend = Legend.new(layer_id: @layer.id)
        legend.valid?

        legend.errors[:layer].should be_empty
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

      it 'requires a definition' do
        @legend.errors[:definition].should_not be_empty
        @legend.errors[:definition].should include('could not be validated')
      end

      it 'validates definition' do
        legend = Legend.new(layer_id: @layer.id, type: 'bubble', definition: {})

        legend.valid?

        legend.errors[:definition].should_not be_empty
        legend.errors[:definition].should_not include('could not be validated')
      end

      it 'rejects empty definitions for custom' do
        legend = Legend.new(layer_id: @layer.id, type: 'custom', definition: {})

        legend.valid?.should be_false
        legend.errors[:definition].should_not be_empty
      end

      describe('#conf') do
        it 'rejects spam' do
          bad_conf = { not_column_name: 'not array' }
          legend = Legend.new(layer_id: @layer.id,
                              type: 'bubble',
                              definition: {},
                              conf: bad_conf)

          legend.valid?

          legend.errors[:conf].should_not be_empty
          legend.errors[:conf].should_not include('could not be validated')
        end

        it 'rejects incorrect type for \'columns\'' do
          bad_conf = { columns: 'not array' }
          legend = Legend.new(layer_id: @layer.id,
                              type: 'bubble',
                              definition: {},
                              conf: bad_conf)

          legend.valid?

          legend.errors[:conf].should_not be_empty
          legend.errors[:conf].should_not include('could not be validated')
        end

        it 'rejects incorrect type for \'columns\' contents' do
          bad_conf = { columns: ['manolo', 'escobar', 3] }
          legend = Legend.new(layer_id: @layer.id,
                              type: 'bubble',
                              definition: {},
                              conf: bad_conf)

          legend.valid?

          legend.errors[:conf].should_not be_empty
          legend.errors[:conf].should_not include('could not be validated')
        end

        it 'accepts proper conf' do
          bad_conf = { columns: ['manolo', 'escobar'] }
          legend = Legend.new(layer_id: @layer.id,
                              type: 'bubble',
                              definition: {},
                              conf: bad_conf)

          legend.valid?

          legend.errors[:conf].should be_empty
        end
      end

      it 'rejects html type' do
        legend = Legend.new(layer_id: @layer.id, type: 'html', definition: {})

        legend.valid?.should be_false
        legend.errors[:type].should_not be_empty
      end
    end
  end
end
