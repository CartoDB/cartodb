# encoding: utf-8

require_relative '../../../spec_helper'
require_dependency 'carto/uuidhelper'

include Carto::UUIDHelper

shared_context 'layer hierarchy' do
  before(:all) do
    @user1 = FactoryGirl.create(:valid_user, private_tables_enabled: true, private_maps_enabled: true)
    @user2 = FactoryGirl.create(:valid_user, private_tables_enabled: true)
    @map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
    @layer = @map.layers.first
    @visualization = FactoryGirl.create(:carto_visualization, map: @map, privacy: Carto::Visualization::PRIVACY_PRIVATE, user_id: @user1.id)
  end

  before(:each) do
    @widget = FactoryGirl.create(:widget, layer: @layer)
  end

  after(:each) do
    Carto::Widget.destroy_all
  end

  after(:all) do
    @visualization.destroy if @visualization
  end

  def response_widget_should_match_widget(response_widget, widget)
    response_widget[:id].should == widget.id
    response_widget[:order].should == widget.order
    response_widget[:type].should == widget.type
    response_widget[:title].should == widget.title
    response_widget[:layer_id].should == widget.layer.id
    response_widget[:options].should == widget.options.symbolize_keys
    response_widget[:style].should == widget.style.symbolize_keys
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
    if payload[:style].present?
      response_widget[:style].should == payload[:style].symbolize_keys
    else
      response_widget[:style].blank?.should be_true
    end
    if payload[:source].present?
      response_widget[:source][:id].should == payload[:source][:id]
    else
      response_widget[:source].should be_nil
    end
    if payload[:order].present?
      response_widget[:order].should == payload[:order]
    else
      @visualization.reload
      response_widget[:order].should == @visualization.widgets.count - 1
    end
  end

  def widget_payload(
    layer_id: @layer.id,
    type: 'formula',
    title: 'the title',
    options: { 'a field' => 'first', 'another field' => 'second' },
    order: nil,
    source: { id: 'a0' },
    style: { 'widget_style': { 'fill': 'wadus' } })

    payload = {
      layer_id: layer_id,
      type: type,
      title: title,
      options: options,
      style: style
    }

    payload[:order] = order if order
    payload[:source] = source if source

    payload
  end
end

describe Carto::Api::WidgetsController do
  include_context 'layer hierarchy'

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
      Carto::Visualization.stubs(:privacy).returns('public')
      get_json widget_url(user_domain: @user2.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end
  end

  describe '#create' do
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

    it 'creates a new widget with order' do
      payload = widget_payload(order: 7)
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response_widget = response.body
        response_widget_should_match_payload(response_widget, payload)
        widget = Carto::Widget.find(response_widget[:id])
        response_widget_should_match_widget(response_widget, widget)
        widget.destroy
      end
    end

    it 'creates a new widget without style' do
      payload = widget_payload.reject { |p| p == :style }
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
      analysis = FactoryGirl.create(:analysis, visualization: @visualization, user_id: @user1.id)
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
      other_map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      other_layer = other_map.data_layers.first
      other_layer.should_not be_nil

      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: other_layer.id, api_key: @user1.api_key), widget_payload(layer_id: other_layer.id), http_json_headers do |response|
        response.status.should == 422
      end

      other_map.destroy
    end

    it 'returns 422 if missing source' do
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user1.api_key), widget_payload(source: nil), http_json_headers do |response|
        response.status.should == 422
      end
    end

    it 'returns 403 if visualization is private and current user is not the owner' do
      post_json widgets_url(user_domain: @user2.username, map_id: @map.id, map_layer_id: @widget.layer_id, api_key: @user2.api_key), widget_payload, http_json_headers do |response|
        response.status.should == 403
      end
    end

    it 'assigns consecutive orders for widgets for the same visualization' do
      # Note: First widget is already created in the layer hierarchy context
      @layer.widgets.reload.each(&:destroy)

      payload = widget_payload(layer_id: @layer.id)
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @layer.id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response.body[:order].should == 0
      end
      post_json widgets_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @layer.id, api_key: @user1.api_key), payload, http_json_headers do |response|
        response.status.should == 201
        response.body[:order].should == 1
      end

      Carto::Widget.where(layer_id: @layer.id).destroy_all
    end
  end

  describe '#update' do
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
      analysis = FactoryGirl.create(:analysis, visualization: @visualization, user_id: @user1.id)
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

        Carto::Widget.find(response.body[:id])
        response_widget_should_match_widget(response.body, Carto::Widget.find(response.body[:id]))
      end
      analysis.destroy
    end
  end

  describe '#update_many' do
    it 'updates many' do
      widget2 = FactoryGirl.create(:widget, layer: @layer)

      payload = [serialize_widget(@widget).merge(title: 'wadus'), serialize_widget(widget2).merge(title: 'wadus2')]
      url = api_v3_maps_layers_update_many_widgets_url(user_domain: @user1.username,
                                                       map_id: @map.id,
                                                       api_key: @user1.api_key)
      put_json url, payload, http_json_headers do |response|
        response.status.should == 200
        response.body[0]['title'].should eq 'wadus'
        Carto::Widget.find(response.body[0]['id']).title.should eq 'wadus'
        response.body[1]['title'].should eq 'wadus2'
        Carto::Widget.find(response.body[1]['id']).title.should eq 'wadus2'
      end
    end

    it 'fails with 404 if widget is not found' do
      payload = [serialize_widget(@widget).merge(title: 'wadus')]
      @widget.destroy

      url = api_v3_maps_layers_update_many_widgets_url(user_domain: @user1.username,
                                                       map_id: @map.id,
                                                       api_key: @user1.api_key)

      put_json url, payload, http_json_headers do |response|
        response.status.should == 404
      end
    end

    it 'fails with 404 if widget does not belong to map' do
      payload = [serialize_widget(@widget).merge(title: 'wadus')]
      Carto::Widget.any_instance.stubs(:belongs_to_map?).with(@map.id).returns(false)

      url = api_v3_maps_layers_update_many_widgets_url(user_domain: @user1.username,
                                                       map_id: @map.id,
                                                       api_key: @user1.api_key)

      put_json url, payload, http_json_headers do |response|
        response.status.should == 404
        @widget.reload.title.should_not eq 'wadus'
      end
    end

    it 'fails with 404 if not writable by user' do
      payload = [serialize_widget(@widget).merge(title: 'wadus')]
      Carto::Widget.any_instance.stubs(:writable_by_user?).returns(false)

      url = api_v3_maps_layers_update_many_widgets_url(user_domain: @user1.username,
                                                       map_id: @map.id,
                                                       api_key: @user1.api_key)

      put_json url, payload, http_json_headers do |response|
        response.status.should == 403
        @widget.reload.title.should_not eq 'wadus'
      end
    end

    it 'fails if any of the widgets fails and doesn\'t update any' do
      widget2 = FactoryGirl.create(:widget, layer: @layer)
      Carto::Widget.stubs(:find).with(@widget.id).returns(@widget)
      Carto::Widget.stubs(:find).with(widget2.id).raises(ActiveRecord::RecordNotFound.new)

      payload = [serialize_widget(@widget).merge(title: 'wadus'), serialize_widget(widget2).merge(title: 'wadus2')]
      url = api_v3_maps_layers_update_many_widgets_url(user_domain: @user1.username,
                                                       map_id: @map.id,
                                                       api_key: @user1.api_key)
      put_json url, payload, http_json_headers do |response|
        response.status.should == 404
        Carto::Widget.unstub(:find)
        @widget.reload.title.should_not eq 'wadus'
        widget2.reload.title.should_not eq 'wadus2'
      end
    end

    def serialize_widget(w)
      payload = {
        id: w.id,
        layer_id: w.layer_id,
        type: w.type,
        title: w.title,
        options: w.options,
        style: w.style
      }
      payload[:order] = w.order if w.order
      payload[:source] = { id: w.source_id } if w.source_id

      payload
    end
  end

  describe '#delete' do
    it 'returns 200 and deletes the widget' do
      delete_json widget_url(user_domain: @user1.username, map_id: @map.id, map_layer_id: @widget.layer_id, id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        Carto::Widget.where(id: @widget.id).first.should be_nil
      end
    end
  end
end
