# encoding utf-8

require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

module Carto
  module Api
    describe Carto::Api::LegendsController do
      include Carto::Factories::Visualizations, HelperMethods

      let(:html_legend_payload) do
        {
          pre_html: "<h3>Es acaso</h3>",
          post_html: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "html",
          definition: {
            html: '<h1>Manolo Escobar</h1>'
          }
        }
      end

      let(:category_legend_payload) do
        {
          pre_html: "<h3>Es acaso</h3>",
          post_html: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "category",
          definition: {}
        }
      end

      let(:custom_legend_payload) do
        {
          pre_html: "<h3>Es acaso</h3>",
          post_html: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "custom",
          definition: {
            categories: [
              { title: 'Manolo Escobar' },
              { title: 'Manolo Escobar', color: '#fff' },
              { title: 'Manolo Escobar', icon: 'super.png' },
              { title: 'Manolo Escobar', icon: 'super.png', color: '#FFF' }
            ]
          }
        }
      end

      let(:bubble_legend_payload) do
        {
          pre_html: "<h3>Es acaso</h3>",
          post_html: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "bubble",
          definition: {
            color: '#fff'
          }
        }
      end

      let(:choropleth_legend_payload) do
        {
          pre_html: "<h3>Es acaso</h3>",
          post_html: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "choropleth",
          definition: {
            prefix: "123",
            suffix: "foo"
          }
        }
      end

      let(:fake_uuid) { 'aaaaaaaa-0000-bbbb-1111-cccccccccccc' }

      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @intruder = FactoryGirl.create(:carto_user)
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
        @layer = @visualization.data_layers.first
      end

      after(:all) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
        @user.destroy
        @intruder.destroy
        @layer = nil
      end

      def legend_is_correct(legend)
        legend = legend.deep_symbolize_keys
        saved_legend = LegendPresenter.new(Legend.find(legend[:id])).to_hash

        pruned_legend = prune_legend(legend)
        pruned_saved_legend = prune_legend(saved_legend)

        legend_definition = legend[:definition].with_indifferent_access
        saved_legend_definition = saved_legend[:definition]
                                  .with_indifferent_access

        pruned_legend.should eq pruned_saved_legend
        legend_definition.should eq saved_legend_definition
      end

      def prune_legend(legend)
        legend.except(:created_at, :updated_at, :definition)
      end

      describe '#create' do
        before(:each) { @layer.reload.legends.map(&:destroy) }

        def create_lengend_url(user: @user, visualization: @visualization, layer: @layer)
          legends_url(user_domain: user.subdomain,
                      visualization_id: visualization.id,
                      layer_id: layer.id,
                      api_key: user.api_key)
        end

        it 'should reject non visualization owners' do
          post_json create_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403
          end
        end

        it 'should reject non data layers' do
          base_layer = @visualization.layers.first

          post_json create_lengend_url(layer: base_layer), html_legend_payload do |response|
            response.status.should eq 422

            response.body[:errors].should include("'#{base_layer.kind}' layers can't have legends")
          end
        end

        it 'should reject more that Legend:MAX_LEGENDS_PER_LAYER legends per layer' do
          Legend::MAX_LEGENDS_PER_LAYER.times do
            post_json create_lengend_url, html_legend_payload do |response|
              response.status.should eq 201

              legend_is_correct(response.body)
            end
          end

          post_json create_lengend_url, html_legend_payload do |response|
            response.status.should eq 422

            response.body[:errors].should include('Maximum number of legends per layer reached')
          end
        end

        it 'should return a validation errors' do
          post_json create_lengend_url, {} do |response|
            response.status.should eq 422

            response.body[:errors].should_not be_nil
          end
        end

        describe 'with valid definitions' do
          after(:each) do
            post_json create_lengend_url, @payload do |response|
              response.status.should eq 201

              legend_is_correct(response.body)
            end
          end

          after(:all) do
            @payload = nil
          end

          it 'for html' do
            @payload = html_legend_payload
          end

          it 'for category' do
            @payload = category_legend_payload
          end

          it 'for custom' do
            @payload = custom_legend_payload
          end

          it 'for bubble' do
            @payload = bubble_legend_payload
          end

          it 'for choropleth' do
            @payload = choropleth_legend_payload
          end
        end

        describe 'with spammy definitions' do
          after(:each) do
            spammy_definition = @payload[:definition].merge(spam: 'hell')
            @payload[:definition] = spammy_definition

            post_json create_lengend_url, @payload do |response|
              response.status.should eq 422
            end
          end

          after(:all) do
            @payload = nil
          end

          it 'banned for html' do
            @payload = html_legend_payload
          end

          it 'banned for category' do
            @payload = category_legend_payload
          end

          it 'banned for custom' do
            @payload = custom_legend_payload
          end

          it 'banned for bubble' do
            @payload = bubble_legend_payload
          end

          it 'banned for choropleth' do
            @payload = choropleth_legend_payload
          end
        end

        it 'handles bad layer_id' do
          url = legends_url(user_domain: @user.subdomain,
                            visualization_id: @visualization.id,
                            layer_id: fake_uuid,
                            api_key: @user.api_key)
          post_json url, {} do |response|
            response.status.should eq 404
            response.body[:errors].should include('Layer not found')
          end
        end

        it 'handles bad visualization_id' do
          url = legends_url(user_domain: @user.subdomain,
                            visualization_id: fake_uuid,
                            layer_id: @layer.id,
                            api_key: @user.api_key)

          post_json url, {} do |response|
            response.status.should eq 404
            response.body[:errors].should include('Visualization not found')
          end
        end
      end

      describe '#show' do
        before (:all) { @legend = Legend.create!(html_legend_payload.merge(layer_id: @layer.id)) }
        after  (:all) { @legend.destroy }

        def show_lengend_url(user: @user, visualization: @visualization, layer: @layer, legend: @legend)
          legend_url(user_domain: user.subdomain,
                     visualization_id: visualization.id,
                     layer_id: layer.id,
                     id: legend.id,
                     api_key: user.api_key)
        end

        it 'should show a legend' do
          get_json show_lengend_url, {} do |response|
            response.status.should eq 200

            legend_is_correct(response.body)
          end
        end

        it 'should not show a legend to others' do
          get_json show_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403
          end
        end

        it 'handles bad legend_id' do
          url = legend_url(user_domain: @user.subdomain,
                           visualization_id: @visualization.id,
                           layer_id: @layer.id,
                           id: fake_uuid,
                           api_key: @user.api_key)

          get_json url, {} do |response|
            response.status.should eq 404
            response.body[:errors].should include('Legend not found')
          end
        end
      end

      describe '#update' do
        before (:all) { @legend = Legend.create!(html_legend_payload.merge(layer_id: @layer.id)) }
        after  (:all) { @legend.destroy }

        def update_lengend_url(user: @user, visualization: @visualization, layer: @layer, legend: @legend)
          legend_url(user_domain: user.subdomain,
                     visualization_id: visualization.id,
                     layer_id: layer.id,
                     id: legend.id,
                     api_key: user.api_key)
        end

        it 'updates a legend' do
          html_legend_payload[:definition][:html] = '<p>modified</p>'
          put_json update_lengend_url, html_legend_payload do |response|
            response.status.should eq 200

            legend_is_correct(response.body)
          end
        end

        it 'updates a legend when max legends reached' do
          (Legend::MAX_LEGENDS_PER_LAYER - 1).times do
            Legend.create!(html_legend_payload.merge(layer_id: @layer.id))
          end

          html_legend_payload[:definition][:html] = '<p>modified</p>'
          put_json update_lengend_url, html_legend_payload do |response|
            response.status.should eq 200

            legend_is_correct(response.body)
          end

          @layer.reload.legends.map(&:destroy)

          @legend = Legend.create!(html_legend_payload.merge(layer_id: @layer.id))
        end

        it 'should let others update a legend' do
          put_json update_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403
          end
        end

        it 'handles bad legend_id' do
          url = legend_url(user_domain: @user.subdomain,
                           visualization_id: @visualization.id,
                           layer_id: @layer.id,
                           id: fake_uuid,
                           api_key: @user.api_key)

          put_json url, {} do |response|
            response.status.should eq 404
            response.body[:errors].should include('Legend not found')
          end
        end
      end

      describe '#index' do
        before(:all) do
          @layer.reload.legends.map(&:destroy)
          Legend.create!(html_legend_payload.merge(layer_id: @layer.id))
          Legend.create!(html_legend_payload.merge(layer_id: @layer.id))
        end

        after(:all) do
          @layer.reload.legends.map(&:destroy)
        end

        def index_lengend_url(user: @user, visualization: @visualization, layer: @layer)
          legends_url(user_domain: user.subdomain,
                      visualization_id: visualization.id,
                      layer_id: layer.id,
                      api_key: user.api_key)
        end

        it 'indexes legends' do
          get_json index_lengend_url, {} do |response|
            response.status.should eq 200

            response.body.each do |legend|
              legend_is_correct(legend)
            end
          end
        end

        it 'should not index legends to others' do
          get_json index_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403
          end
        end
      end

      describe '#delete' do
        before (:each) { @legend = Legend.create!(html_legend_payload.merge(layer_id: @layer.id)) }
        after  (:each) { @legend.destroy }

        def delete_lengend_url(user: @user, visualization: @visualization, layer: @layer, legend: @legend)
          legend_url(user_domain: user.subdomain,
                     visualization_id: visualization.id,
                     layer_id: layer.id,
                     id: legend.id,
                     api_key: user.api_key)
        end

        it 'should delete a legend' do
          delete_json delete_lengend_url, {} do |response|
            response.status.should eq 204

            response.body.should be_empty
          end

          Legend.exists?(@legend.id).should be_false
        end

        it 'should not delete another user\'s legend' do
          delete_json delete_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403
          end

          Legend.exists?(@legend.id).should be_true
        end

        it 'handles bad legend_id' do
          url = legend_url(user_domain: @user.subdomain,
                           visualization_id: @visualization.id,
                           layer_id: @layer.id,
                           id: fake_uuid,
                           api_key: @user.api_key)

          delete_json url, {} do |response|
            response.status.should eq 404
            response.body[:errors].should include('Legend not found')
          end
        end
      end
    end
  end
end
