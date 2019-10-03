# require_dependency 'carto/controller_helper'

module Carto
  module Api
    module Public
      class DataObservatoryController < Carto::Api::Public::ApplicationController
        include Carto::ControllerHelper
        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_order, only: [:datasets]
        before_action :check_permissions

        setup_default_rescues

        respond_to :json

        BIGQUERY_KEY = 'bq'.freeze
        VALID_ORDER_PARAMS = %i(id table dataset project).freeze

        def token
          response = Cartodb::Central.new.get_do_token(@user.username)
          render(json: response)
        end

        def datasets
          available_datasets = bq_datasets.select { |dataset| Time.parse(dataset['expires_at']) > Time.now }
          response = present_datasets(available_datasets)
          render(json: { datasets: response })
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_order
          _, _, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS, default_order: 'id', default_order_direction: 'asc'
          )
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key&.master? || api_key&.data_observatory_permissions?
        end

        def bq_datasets
          redis_key = "do:#{@user.username}:datasets"
          redis_value = $users_metadata.hget(redis_key, BIGQUERY_KEY) || '[]'
          JSON.parse(redis_value)
        end

        def present_datasets(datasets)
          enriched_datasets = datasets.map do |dataset|
            dataset_id = dataset['dataset_id']
            project, dataset, table = dataset_id.split('.')
            { project: project, dataset: dataset, table: table, id: dataset_id }
          end
          ordered_datasets = enriched_datasets.sort_by { |dataset| dataset[@order] }
          @direction == :asc ? ordered_datasets : ordered_datasets.reverse
        end

      end
    end
  end
end
