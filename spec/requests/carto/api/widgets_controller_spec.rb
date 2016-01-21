# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

shared_context 'layer hierarchy' do
  before(:each) do
    @map = FactoryGirl.create(:carto_map_with_layers)
    @layer = @map.layers.first
    @widget = FactoryGirl.create(:widget, layer: @layer)
    @visualization = FactoryGirl.create(:carto_visualization, map: @map, privacy: Carto::Visualization::PRIVACY_PRIVATE, user_id: @user1.id)
  end

  after(:each) do
    @visualization.destroy if @visualization
    @widget.destroy if @widget
  end

  def response_widget_should_match_widget(response_widget, widget)
    response_widget[:id].should == widget.id
    response_widget[:order].should == widget.order
    response_widget[:type].should == widget.type
    response_widget[:title].should == widget.title
    response_widget[:layer_id].should == widget.layer.id
    response_widget[:dataview].should == widget.dataview
    JSON.parse(response_widget[:dataview]).should == JSON.parse(widget.dataview)
  end

  def response_widget_should_match_payload(response_widget, payload)
    response_widget[:layer_id].should == payload[:layer_id]
    response_widget[:type].should == payload[:type]
    response_widget[:title].should == payload[:title]
    JSON.parse(response_widget[:dataview]).should == payload[:dataview]
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
    @public_visualization.destroy if @public_visualization
    @public_widget.destroy if @public_widget
  end

  let(:random_map_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_layer_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_widget_id) { UUIDTools::UUID.timestamp_create.to_s }

  describe '#show' do
    it 'returns 401 for non-authenticated requests' do
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: random_map_id, layer_id: random_layer_id, widget_id: random_widget_id), {}, http_json_headers do |response|
        response.status.should == 401
      end
    end

    it 'returns 404 for requests without matching map, layer or widget' do
      map_id = @map.id
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: random_map_id, layer_id: @layer.id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: map_id, layer_id: random_layer_id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: map_id, layer_id: @widget.layer_id, widget_id: random_widget_id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end
    end

    it 'returns the source widget content' do
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: @map.id, layer_id: @widget.layer_id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        response_widget_should_match_widget(response.body, @widget)
      end
    end

    it 'returns 403 if visualization is private and current user is not the owner' do
      get_json api_v3_widgets_show_url(user_domain: @user2.username, map_id: @map.id, layer_id: @widget.layer_id, widget_id: @widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end

    it 'returns 403 if visualization is public and current user is not the owner' do
      get_json api_v3_widgets_show_url(user_domain: @user2.username, map_id: @public_map.id, layer_id: @public_widget.layer_id, widget_id: @public_widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end
  end

  describe '#create' do
    include_context 'layer hierarchy'

    def widget_payload
      {
        layer_id: @layer.id,
        type: 'formula',
        title: 'the title',
        dataview: {
          'a field' => 'first',
          'another field' => 'second'
        }
      }
    end

    it 'creates a new widget' do
      payload = widget_payload
      post_json api_v3_widgets_create_url(user_domain: @user1.username, map_id: @map.id, layer_id: @widget.layer_id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response_widget = response.body
        response_widget_should_match_payload(response_widget, payload)
        widget = Carto::Widget.find(response_widget[:id])
        response_widget_should_match_widget(response_widget, widget)
      end
    end
  end
end
