# encoding: utf-8
require_relative '../../spec_helper'
require 'rspec/core'
require 'ostruct'
require_relative '../../../app/models/layer/presenter'

include CartoDB

describe CartoDB::LayerModule::Presenter do
  describe '#to_vizjson_v2' do
    it 'wraps the sql if query_wrapper available' do
      layer = OpenStruct.new(
        public_values: { 'options' => {'visible' => nil} },
        tooltip: { 'template' => 'blahblah' },
        kind:           'carto',
        options: {
          'query'         => '',
          'tile_style'    => '',
          'interactivity' => '',
          'style_version' => '',
          'table_name'    => 'bogus_table',
          'query_wrapper' => 'bogus template <%= sql %>'
        }
      )

      vizjson = CartoDB::LayerModule::Presenter.new(layer).to_vizjson_v2
      vizjson.fetch(:options).fetch(:sql)
        .should == 'bogus template select * from bogus_table'

      layer = OpenStruct.new(
        public_values: { 'options' => {'visible' => nil} },
        tooltip: { 'template' => 'blahblah' },
        kind:           'carto',
        options: {
          'query'         => 'select the_geom from bogus_table',
          'tile_style'    => '',
          'interactivity' => '',
          'style_version' => '',
          'table_name'    => 'bogus_table',
          'query_wrapper' => 'bogus template <%= sql %>'
        }
      )

      vizjson = CartoDB::LayerModule::Presenter.new(layer).to_vizjson_v2
      vizjson.fetch(:options).fetch(:sql)
        .should == 'bogus template select the_geom from bogus_table'
    end

    it 'returns `sql_wrap` with `query_wrapper if present`' do
      query_wrapper = 'bogus template <%= sql %>'

      layer = OpenStruct.new(
        public_values: { 'options' => { 'visible' => nil } },
        kind: 'carto',
        options: {
          'interactivity' => '',
          'style_version' => '',
          'table_name' => 'bogus_table',
          'query_wrapper' => query_wrapper
        }
      )

      vizjson = CartoDB::LayerModule::Presenter.new(layer).to_vizjson_v2
      vizjson[:options].should include(sql_wrap: query_wrapper)
    end

    it 'keeps the visible attribute when rendering' do
      layer = OpenStruct.new(
        kind:           'torque',
        options: {
          'query'         => 'select the_geom from bogus_table',
          'tile_style'    => '',
          'interactivity' => '',
          'style_version' => '',
          'table_name'    => 'bogus_table',
          'query_wrapper' => 'bogus template <%= sql %>',
          'visible' => true
        },
      )

      options = {
        visualization_id: '',
        sql: '',
      }

      vizjson = CartoDB::LayerModule::Presenter.new(layer, options).to_vizjson_v2
      vizjson[:options]['visible'].should == true
    end

  end
end
