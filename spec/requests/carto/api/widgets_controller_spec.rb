# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_dependency 'carto/uuidhelper'

include Carto::UUIDHelper

shared_context 'layer hierarchy' do
  before(:each) do
    @map = FactoryGirl.create(:carto_map_with_layers)
    @layer = @map.layers.first
    @widget = FactoryGirl.create(:widget, layer: @layer)
    @visualization = FactoryGirl.create(:carto_visualization, map: @map, privacy: Carto::Visualization::PRIVACY_PRIVATE, user_id: @user1.id)
  end

  after(:each) do
    Carto::Widget.destroy_all
    @visualization.destroy if @visualization
  end

  def response_widget_should_match_widget(response_widget, widget)
    response_widget[:id].should == widget.id
    response_widget[:order].should == widget.order
    response_widget[:type].should == widget.type
    response_widget[:title].should == widget.title
    response_widget[:layer_id].should == widget.layer.id
    response_widget[:options].should == widget.options.symbolize_keys
    if widget.source_id.present?
      response_widget[:source][:id].should eq widget.source_id
    else
      response_widget[:source].should be_nil
    end
  end

  def response_widget_should_match_payload(response_widget, payload)
    response_widget[:layer_id].should == payload[:layer_id]
    response_widget[:type].should == payload[:type]
    response_widget[:title].should == payload[:title]
    response_widget[:options].should == payload[:options].symbolize_keys
    if payload[:source].present?
      response_widget[:source][:id].should == payload[:source][:id]
    else
      response_widget[:source].should be_nil
    end
  end

  def widget_payload(
    layer_id: @layer.id,
    type: 'formula',
    title: 'the title',
    options: { 'a field' => 'first', 'another field' => 'second' },
    order: nil,
    source: nil)

    payload = {
      layer_id: layer_id,
      type: type,
      title: title,
      options: options
    }

    payload[:order] = order if order
    payload[:source] = source if source

    payload
  end
end

describe Carto::Api::WidgetsController do
  include_context 'users helper'
  include_context 'layer hierarchy'

  before(:each) do
    @public_map = FactoryGirl.create(:carto_map_with_layers)
    @public_layer = @public_map.layers.first
    @public_widget = FactoryGirl.create(:widget, layer: @public_layer)

    @public_visualization = FactoryGirl.create(:carto_visualization, map: @public_map, privacy: Carto::Visualization::PRIVACY_PUBLIC, user_id: @user1.id)
  end

  after(:each) do
    @public_widget.destroy if @public_widget
    @public_visualization.destroy if @public_visualization
  end

  let(:random_map_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_layer_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_widget_id) { UUIDTools::UUID.timestamp_create.to_s }

  describe '#show' do
    it 'returns 401 for non-authenticated requests' do
      get_json widget_url(user_domain: @user1.username, map_id: random_map_id, map_layer_id: random_layer_id, id: random_widget_id), {}, http_json_headers do |response|
        response.status.should == 401
      end
    end

    it 'returns 404 for requests without matching map, layer or widget' do
      map_id = @map.id
      get_json widget_url(user_domain: @user1.username, map_id: random_map_id, map_layer_id: @layer.id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json widget_url(user_domain: @user1.username, map_id: map_id, map_layer_id: random_layer_id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json widget_url(user_domain: @user1.username, map_id: map_id, map_layer_id: @widget.layer_id, id: random_widget_id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end
    end

    it 'returns the source widget content' do
      get_json widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        response_widget_should_match_widget(response.body, @widget)
      end
    end

    it 'returns options as json' do
      get widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers
      response.status.should == 200
      JSON.parse(response.body).class.should == Hash
      JSON.parse(response.body)['options'].class.should == Hash
    end

    it 'returns 403 if visualization is private and current user is not the owner' do
      get_json widget_url(user_domain: @user2.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end

    it 'returns 403 if visualization is public and current user is not the owner' do
      get_json widget_url(user_domain: @user2.username, map_id: @public_map.id, map_layer_id: @public_widget.layer_id, id: @public_widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end
  end

  describe '#create' do
    include_context 'layer hierarchy'

    it 'creates a new widget' do
      payload = widget_payload
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response_widget = response.body
        response_widget_should_match_payload(response_widget, payload)
        widget = Carto::Widget.find(response_widget[:id])
        response_widget_should_match_widget(response_widget, widget)
        widget.destroy
      end
    end

    it 'creates a new widget with source_id' do
      analysis = FactoryGirl.create(:analysis, visualization: @public_visualization, user_id: @user1.id)
      payload = widget_payload.merge(source: { id: analysis.natural_id })
      url = widgets_url(
        user_domain: @user1.username,
        map_id: @map.id,
        map_layer_id: @widget.layer_id,
        api_key: @user1.api_key)
      post_json url, payload, http_json_headers do |response|
        response.status.should eq 201
        response_widget = response.body
        response_widget[:source][:id].should eq analysis.natural_id
        widget = Carto::Widget.find(response_widget[:id])
        widget.source_id.should eq analysis.natural_id
        widget.destroy
      end
      analysis.destroy
    end

    it 'returns 404 for unknown map id' do
      post_json widgets_url(user_domain: @user1.username, map_id: random_uuid, map_layer_id: @widget.layer_id, api_key: @user1.api_key), widget_payload, http_json_headers do |response|
        response.status.should == 404
      end
    end

    it 'returns 422 if layer id do not match' do
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: random_uuid, api_key: @user1.api_key), widget_payload, http_json_headers do |response|
        response.status.should == 422
      end
    end

    it 'returns 422 if payload layer id do not match' do
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user1.api_key), widget_payload(layer_id: random_uuid), http_json_headers do |response|
        response.status.should == 422
      end
    end

    it 'returns 422 if layer id do not match map' do
      other_map = FactoryGirl.create(:carto_map_with_layers)
      other_layer = other_map.data_layers.first
      other_layer.should_not be_nil

      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: other_layer.id, api_key: @user1.api_key), widget_payload(layer_id: other_layer.id), http_json_headers do |response|
        response.status.should == 422
      end

      other_map.destroy
    end

    it 'returns 403 if visualization is private and current user is not the owner' do
      post_json widgets_url(user_domain: @user2.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user2.api_key), widget_payload, http_json_headers do |response|
        response.status.should == 403
      end
    end

    it 'assigns consecutive orders for widgets for the same layer' do
      layer = FactoryGirl.create(:carto_layer, maps: [@map])

      payload = widget_payload(layer_id: layer.id)
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: layer.id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response.body[:order].should == 1
      end
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: layer.id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response.body[:order].should == 2
      end

      Carto::Widget.where(layer_id: layer.id).destroy_all
      layer.destroy
    end
  end

  describe '#update' do
    include_context 'layer hierarchy'

    it 'returns 422 if layer id does not match in url and payload' do
      put_json widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), widget_payload(layer_id: random_uuid), http_json_headers do |response|
        response.status.should == 422
      end
    end

    it 'ignores payload id' do
      put_json widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), widget_payload.merge(id: random_uuid), http_json_headers do |response|
        response.status.should == 200
      end
    end

    it 'returns 200 and updates the model' do
      analysis = FactoryGirl.create(:analysis, visualization: @public_visualization, user_id: @user1.id)
      new_order = @widget.order + 1
      new_type = "new #{@widget.type}"
      new_title = "new #{@widget.title}"
      new_options = @widget.options.merge(new: 'whatever')

      payload = widget_payload(
        order: new_order,
        type: new_type,
        title: new_title,
        options: new_options,
        source: { id: analysis.natural_id }
      )

      url = widget_url(
        user_domain: @user1.username,
        map_id: @map.id,
        map_layer_id: @widget.layer_id,
        id: @widget.id,
        api_key: @user1.api_key)

      put_json url, payload, http_json_headers do |response|
        response.status.should eq 200
        response_widget_should_match_payload(response.body, payload)

        loaded_widget = Carto::Widget.find(response.body[:id])
        response_widget_should_match_widget(response.body, Carto::Widget.find(response.body[:id]))
      end
      analysis.destroy
    end
  end

  describe '#delete' do
    include_context 'layer hierarchy'

    it 'returns 200 and deletes the widget' do
      delete_json widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        Carto::Widget.where(id: @widget.id).first.should be_nil
      end
    end
  end
end
