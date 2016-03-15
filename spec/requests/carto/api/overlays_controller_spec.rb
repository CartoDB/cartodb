# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/overlays_controller'
require_relative '../../../../spec/requests/api/json/overlays_controller_shared_examples'

describe Carto::Api::OverlaysController do

  it_behaves_like 'overlays controllers' do
  end

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @api_key = @user.api_key

    @user2 = create_user

    host! 'test.localhost.lan'
  end

  before(:each) do
    stub_named_maps_calls
    delete_user_data @user
    @table = create_table user_id: @user.id
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  let(:params) { { api_key: @user.api_key, visualization_id: @table.table_visualization.id } }

  FAKE_UUID = '00000000-0000-0000-0000-000000000000'.freeze

  describe '#index' do
    it 'lists all overlays' do
      existing_overlay_ids = []
      get_json api_v1_visualizations_overlays_index_url(params) do |response|
        response.status.should be_success
        response.body.count.should eq 5 # Newly created overlays have this amount of layers
        existing_overlay_ids = response.body.map { |overlay| overlay['id'] }
      end

      header_overlay = Carto::Overlay.new(type: 'header', visualization_id: params[:visualization_id], order: 1)
      header_overlay.save

      text_overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id], order: 2)
      text_overlay.save

      new_overlay_ids = [header_overlay.id, text_overlay.id]

      get_json api_v1_visualizations_overlays_index_url(params) do |response|
        response.status.should be_success
        current_overlay_ids = response.body.map { |overlay| overlay['id'] }
        response.body.count.should == new_overlay_ids.count + existing_overlay_ids.count
        # == checks order, while intersection doesn't
        (current_overlay_ids & (existing_overlay_ids + new_overlay_ids) == current_overlay_ids).should eq true
      end
    end

    it 'returns 401 when accessing other users overlays' do
      get_json api_v1_visualizations_overlays_index_url(params.merge(api_key: @user2.api_key)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end

    it 'returns 401 when accessing non-existing visualization' do
      get_json api_v1_visualizations_overlays_index_url(params.merge(visualization_id: FAKE_UUID)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end
  end

  describe '#show' do
    it 'gets the details of an overlay' do
      header_overlay = Carto::Overlay.new(type: 'header', visualization_id: params[:visualization_id])
      header_overlay.save

      get_json api_v1_visualizations_overlays_show_url(params.merge(id: header_overlay.id)) do |response|
        response.status.should be_success
        response.body[:id].should == header_overlay.id
        response.body[:visualization_id].should == params[:visualization_id]
      end
    end

    it 'returns 401 when accessing other users overlays' do
      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      get_json api_v1_visualizations_overlays_show_url(params.merge(id: overlay.id, api_key: @user2.api_key)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end

    it 'returns 401 when accessing non-existing overlay' do
      get_json api_v1_visualizations_overlays_show_url(params.merge(id: FAKE_UUID)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end
  end

  describe '#create' do
    it 'creates an overlay' do
      payload = {
        type: 'header',
        template: 'wadus',
        order: 0,
        options: { "display" => true }
      }

      post_json api_v1_visualizations_overlays_create_url(params), payload do |response|
        response.status.should be_success
        response.body[:id].should be
        response.body[:type].should eq payload[:type]
        response.body[:template].should eq payload[:template]
        response.body[:order].should eq payload[:order]
        response.body[:options].should eq payload[:options]
      end

      overlay = Carto::Overlay.where(visualization_id: params[:visualization_id], template: 'wadus').first
      overlay.should be
      overlay.type.should eq payload[:type]
      overlay.template.should eq payload[:template]
      overlay.order.should eq payload[:order]
      overlay.options.should eq payload[:options]
    end

    it 'fails to create two overlays of the same unique type' do
      header_overlay = Carto::Overlay.new(type: 'header', visualization_id: params[:visualization_id])
      header_overlay.save

      payload = {
        type: 'header'
      }

      post_json api_v1_visualizations_overlays_create_url(params), payload do |response|
        response.status.should eq 400
        response.body[:errors].should be
      end

      Carto::Overlay.where(visualization_id: params[:visualization_id], type: 'header').count.should eq 1
    end

    it 'returns 401 when creating overlays in other users viz' do
      payload = {
        type: 'text'
      }

      post_json api_v1_visualizations_overlays_create_url(params.merge(api_key: @user2.api_key)), payload do |response|
        response.status.should eq 401
        response.body.should be_empty
      end

      Carto::Overlay.where(visualization_id: params[:visualization_id], type: 'text').count.should eq 0
    end

    it 'returns 401 when creating overlays in non-existent viz' do
      post_json api_v1_visualizations_overlays_create_url(params.merge(visualization_id: FAKE_UUID)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end
  end

  describe '#update' do
    it 'updates an overlay' do
      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      payload = {
        type: 'header',
        template: 'wadus',
        order: 0,
        options: { "display" => true }
      }

      put_json api_v1_visualizations_overlays_update_url(params.merge(id: overlay.id)), payload do |response|
        response.status.should be_success
        response.body[:id].should be
        response.body[:type].should eq payload[:type]
        response.body[:template].should eq payload[:template]
        response.body[:order].should eq payload[:order]
        response.body[:options].should eq payload[:options]
      end

      overlay.reload
      overlay.type.should eq payload[:type]
      overlay.template.should eq payload[:template]
      overlay.order.should eq payload[:order]
      overlay.options.should eq payload[:options]
    end

    it 'fails to update two overlays of the same unique type' do
      header_overlay = Carto::Overlay.new(type: 'header', visualization_id: params[:visualization_id])
      header_overlay.save

      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      payload = {
        type: 'header'
      }

      put_json api_v1_visualizations_overlays_update_url(params.merge(id: overlay.id)), payload do |response|
        response.status.should eq 400
        response.body[:errors].should be
      end

      overlay.reload
      overlay.type.should eq 'text'
    end

    it 'returns 401 when updating overlays from another user' do
      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      payload = {
        type: 'text'
      }

      put_json api_v1_visualizations_overlays_update_url(params.merge(api_key: @user2.api_key, id: overlay.id)), payload do |response|
        response.status.should eq 401
        response.body.should be_empty
      end

      overlay.reload
      overlay.type.should eq 'text'
    end

    it 'returns 401 when updating non-existing overlay' do
      put_json api_v1_visualizations_overlays_update_url(params.merge(id: FAKE_UUID)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end
  end

  describe '#delete' do
    it 'deletes an overlay' do
      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      delete api_v1_visualizations_overlays_destroy_url(params.merge(id: overlay.id)) do |response|
        response.status.should be_success
      end

      expect { Carto::Overlay.find(overlay.id) }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'returns 401 when deleting overlays from another user' do
      overlay = Carto::Overlay.new(type: 'text', visualization_id: params[:visualization_id])
      overlay.save

      delete api_v1_visualizations_overlays_destroy_url(params.merge(api_key: @user2.api_key, id: overlay.id)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end

      overlay.reload.should be
    end

    it 'returns 401 when deleting non-existent overlays' do
      delete api_v1_visualizations_overlays_destroy_url(params.merge(id: FAKE_UUID)) do |response|
        response.status.should eq 401
        response.body.should be_empty
      end
    end
  end
end
