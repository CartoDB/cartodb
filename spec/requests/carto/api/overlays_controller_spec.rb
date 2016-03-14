# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/overlays_controller'
require_relative '../../../../spec/requests/api/json/overlays_controller_shared_examples'

describe Carto::Api::OverlaysController do

  it_behaves_like 'overlays controllers' do
  end

  describe '#both endpoints tests' do

    before(:all) do
      @user = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex'
      )
      @api_key = @user.api_key

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

    it "Lists all overlays" do

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

    it "Gets the details of an overlay" do
      header_overlay = Carto::Overlay.new(type: 'header', visualization_id: params[:visualization_id])
      header_overlay.save

      get_json api_v1_visualizations_overlays_show_url(params.merge(id: header_overlay.id)) do |response|
        response.status.should be_success
        response.body[:id].should == header_overlay.id
        response.body[:visualization_id].should == params[:visualization_id]
      end
    end
  end
end
