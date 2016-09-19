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
          prehtml: "<h3>Es acaso</h3>",
          posthtml: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "html",
          definition: {
            html: '<h1>Manolo Escobar</h1>'
          }
        }
      end

      let(:category_legend_payload) do
        {
          prehtml: "<h3>Es acaso</h3>",
          posthtml: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "category",
          definition: {}
        }
      end

      let(:custom_legend_payload) do
        {
          prehtml: "<h3>Es acaso</h3>",
          posthtml: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "custom",
          definition: {
            categories: [
              { color: '#fff', title: 'Manolo Escobar' },
              { color: '#000', icon: 'super.png' }
            ]
          }
        }
      end

      let(:bubble_legend_payload) do
        {
          prehtml: "<h3>Es acaso</h3>",
          posthtml: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "bubble",
          definition: {
            fill_color: '#fff'
          }
        }
      end

      let(:choropleth_legend_payload) do
        {
          prehtml: "<h3>Es acaso</h3>",
          posthtml: "<h3>el mejor artista del mundo?</h3>",
          title: "La verdad",
          type: "choropleth",
          definition: {
            prefix: "123",
            suffix: "foo"
          }
        }
      end

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
        persisted_legend = Carto::Legend.find(legend[:id])
        persisted_legend_hash = persisted_legend.to_hash
                                                .except(:created_at, :updated_at, :definition)

        legend.except(:created_at, :updated_at, :definition)
              .should eq persisted_legend_hash

        legend[:definition].with_indifferent_access.should eq persisted_legend.definition
      end

      describe '#create' do
        before (:each)  { @layer.reload.legends.map(&:destroy) }
        after  (:all)   { @layer.reload.legends.map(&:destroy) }

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

        it 'should reject more that Carto::Api::LegendController::MAX_LEGENDS_PER_LAYER legends per layer' do
          Carto::Api::LegendsController::MAX_LEGENDS_PER_LAYER.times do
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

        it 'should create a valid html legend' do
          post_json create_lengend_url, html_legend_payload do |response|
            response.status.should eq 201

            legend_is_correct(response.body)
          end
        end

        it 'should create a valid category legend' do
          post_json create_lengend_url, category_legend_payload do |response|
            response.status.should eq 201

            legend_is_correct(response.body)
          end
        end

        it 'should create a valid custom legend' do
          post_json create_lengend_url, custom_legend_payload do |response|
            response.status.should eq 201

            legend_is_correct(response.body)
          end
        end

        it 'should create a valid bubble legend' do
          post_json create_lengend_url, bubble_legend_payload do |response|
            response.status.should eq 201

            legend_is_correct(response.body)
          end
        end

        it 'should create a valid choropleth legend' do
          post_json create_lengend_url, choropleth_legend_payload do |response|
            response.status.should eq 201

            legend_is_correct(response.body)
          end
        end
      end

      describe '#show' do
        before (:all) { @legend = Carto::Legend.create!(html_legend_payload.merge(layer_id: @layer.id)) }
        after  (:all) { @legend.destroy }

        def show_lengend_url(user: @user, visualization: @visualization, layer: @layer)
          legends_url(user_domain: user.subdomain,
                      visualization_id: visualization.id,
                      layer_id: layer.id,
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

            response.body.should be_empty
          end
        end
      end

      describe '#index' do
        before (:all) { @legends = 5.times { Carto::Legend.create!(html_legend_payload.merge(layer_id: @layer.id)) } }
        after  (:all) { @legends.map(&:destroy) }

        def index_lengend_url(user: @user, visualization: @visualization, layer: @layer)
          legends_url(user_domain: user.subdomain,
                      visualization_id: visualization.id,
                      layer_id: layer.id,
                      api_key: user.api_key)
        end

        it 'indexes legends' do
          get_json index_lengend_url, {} do |response|
            response.status.should eq 200

            legend_is_correct(response.body)
          end
        end

        it 'should not show a legend to others' do
          get_json index_lengend_url(user: @intruder), {} do |response|
            response.status.should eq 403

            response.body.should be_empty
          end
        end
      end
    end
  end
end
