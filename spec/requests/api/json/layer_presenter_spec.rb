# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/models/layer/presenter'
require_relative 'layer_presenter_shared_examples'

describe CartoDB::LayerModule::Presenter do
  # Old presenter, old model
  it_behaves_like 'layer presenters', CartoDB::LayerModule::Presenter, ::Layer

  let(:stat_tag) { '00000000-0000-0000-0000-000000000000' }
  let(:maps_api_template) { "http://{user}.localhost.lan:8181" }
  let(:sql_api_template) { "http://{user}.localhost.lan:8080" }
  let(:presenter_options) { { visualization_id: stat_tag } }

  let(:tested_klass) { CartoDB::LayerModule::Presenter }
  let(:model_klass) { ::Layer }

  # Always uses old models to created data, then battery set one for instantiation
  def instance_of_tested_model(creation_model)
    model_klass.where(id: creation_model.id).first
  end

  def instance_of_tested_class(*args)
    tested_klass.new(*args)
  end

  describe 'to_vizjson_v2() specific behaviour' do
    before(:all) do
      puts "Testing class #{tested_klass} with model #{model_klass}"

      @user_1 = FactoryGirl.create(:valid_user)
      @user_2 = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'outputs visualization_user_name so Torque can generate Maps API url' do
      # torque layer with very basic options
      layer = instance_of_tested_model(Layer.create(kind: 'torque', options: { 'table_name' => 'my_test_table' }))

      expected_vizjson = {
        id: layer.id,
        type: layer.kind,
        order: layer.order,
        legend: nil,
        options: {
          stat_tag: stat_tag,
          maps_api_template: maps_api_template,
          sql_api_template: sql_api_template,
          tiler_protocol: nil,
          tiler_domain: nil,
          tiler_port: nil,
          sql_api_protocol: nil,
          sql_api_domain: nil,
          sql_api_endpoint: nil,
          sql_api_port: nil,
          layer_name: layer.options['table_name'],
          visualization_user_name: nil, # this test visualization hasn't user
          'table_name' => layer.options['table_name'],
          'query' => "select * from #{layer.options['table_name']}"
        }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should eq expected_vizjson

      # torque layer, different viewer
      layer = Layer.create(
        kind: 'torque',
        options: {
          'table_name' => 'my_test_table',
          # This is only for compatibility with old LayerModule::Presenter, new one checkes in the presenter options
          'user_name' => @user_1.database_schema
        }
      )
      layer = instance_of_tested_model(layer)

      expected_vizjson = {
        id: layer.id,
        type: layer.kind,
        order: layer.order,
        legend: nil,
        options: {
          stat_tag: stat_tag,
          maps_api_template: maps_api_template,
          sql_api_template: sql_api_template,
          tiler_protocol: nil,
          tiler_domain: nil,
          tiler_port: nil,
          sql_api_protocol: nil,
          sql_api_domain: nil,
          sql_api_endpoint: nil,
          sql_api_port: nil,
          layer_name: layer.options['table_name'],
          visualization_user_name: nil, # this test visualization hasn't user
          'table_name' => layer.options['table_name'],
          'query' => "select * from public.#{layer.options['table_name']}",
          'user_name' => @user_1.database_schema
        }
      }

      presenter_options = {
        visualization_id: stat_tag,
        viewer_user: @user_2,
        # New presenter way of sending a viewer that's different from the owner
        user: @user_1
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should eq expected_vizjson

      # torque layer, custom query
      layer = Layer.create(
        kind: 'torque',
        options: {
          'query' => 'SELECT * FROM my_test_table LIMIT 5',
          'table_name' => 'my_test_table'
        }
      )
      layer = instance_of_tested_model(layer)

      presenter_options = {
        visualization_id: stat_tag
      }

      expected_vizjson[:id] = layer.id
      expected_vizjson[:options]['query'] = layer.options['query']
      expected_vizjson[:options].delete('user_name')

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should eq expected_vizjson

      # torque layer, with wrapping
      layer = Layer.create(
        kind: 'torque',
        options: {
          'query' => 'SELECT * FROM my_test_table LIMIT 5',
          'table_name' => 'my_test_table',
          'query_wrapper' =>  "select * from (<%= sql %>)",
          # This options shouldn't appear as is not listed at presnter TORQUE_ATTRS
          'wadus' => 'whatever'
        }
      )
      layer = instance_of_tested_model(layer)

      presenter_options = {
        visualization_id: stat_tag
      }

      expected_vizjson[:id] = layer.id
      expected_vizjson[:options]['query'] = "select * from (#{layer.options['query']})"

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should eq expected_vizjson
    end
  end
end
