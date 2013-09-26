# encoding: utf-8
require 'rspec'
require 'ostruct'
require_relative '../../../app/models/layer/presenter'

include CartoDB

describe CartoDB::Layer::Presenter do
  describe '#to_poro' do
    it 'wraps the sql if query_wrapper available' do
      layer = OpenStruct.new(
        public_values:  {}, 
        kind:           'carto',
        options: {
          'query'         => '',
          'tile_style'    => '',
          'interactivity' => '',
          'table_name'    => 'bogus_table',
          'query_wrapper' => 'bogus template <%= sql %>'
        }
      )

      poro = Layer::Presenter.new(layer).to_poro
      poro.fetch(:options).fetch(:query)
        .should == 'bogus template select * from bogus_table'

      layer = OpenStruct.new(
        public_values:  {}, 
        kind:           'carto',
        options: {
          'query'         => 'select the_geom from bogus_table',
          'tile_style'    => '',
          'interactivity' => '',
          'table_name'    => 'bogus_table',
          'query_wrapper' => 'bogus template <%= sql %>'
        }
      )

      poro = Layer::Presenter.new(layer).to_poro
      poro.fetch(:options).fetch(:query)
        .should == 'bogus template select the_geom from bogus_table'
    end
  end
end # Layer::Presenter
