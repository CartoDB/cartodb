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
        before_action :load_filters, only: [:subscriptions]
        before_action :load_id, only: [:subscription_info, :subscribe]
        before_action :load_type, only: [:subscription_info, :subscribe]
        before_action :check_api_key_permissions
        before_action :check_licensing_enabled, only: [:subscription_info, :subscribe]

        setup_default_rescues

        respond_to :json

        BIGQUERY_KEY = 'bq'.freeze
        VALID_TYPES = %w(dataset geography).freeze
        DATASET_REGEX = /[\w\-]+\.[\w\-]+\.[\w\-]+/.freeze
        VALID_ORDER_PARAMS = %i(id table dataset project type).freeze
        METADATA_FIELDS = %i(id estimated_delivery_days subscription_list_price tos tos_link licenses licenses_link
                             rights).freeze
        TABLES_BY_TYPE = { 'dataset' => 'datasets', 'geography' => 'geographies' }.freeze

        def token
          response = Cartodb::Central.new.get_do_token(@user.username)
          render(json: response)
        end

        def subscriptions
          available_subscriptions = bq_subscriptions.select { |dataset| Time.parse(dataset['expires_at']) > Time.now }
          response = present_subscriptions(available_subscriptions)
          render(json: { subscriptions: response })
        end

        def subscription_info
          response = subscription_metadata.slice(*METADATA_FIELDS)

          render(json: response)
        end

        def subscribe
          metadata = subscription_metadata
          response = metadata.slice(*METADATA_FIELDS)

          return render(json: response) if metadata[:estimated_delivery_days].positive?

          license_info = {
            dataset_id: metadata[:id],
            available_in: metadata[:available_in],
            price: metadata[:subscription_list_price],
            expires_at: Time.now.round + 1.year
          }
          Carto::DoLicensingService.new(@user.username).subscribe([license_info])

          render(json: response)
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_filters
          _, _, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS, default_order: 'id', default_order_direction: 'asc'
          )
          load_type(required: false)
        end

        def load_id
          @id = params[:id]
          raise ParamInvalidError.new(:id) unless @id =~ DATASET_REGEX
        end

        def load_type(required: true)
          @type = params[:type]
          return if @type.nil? && !required

          raise ParamInvalidError.new(:type, VALID_TYPES.join(', ')) unless VALID_TYPES.include?(@type)
        end

        def check_api_key_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key&.master? || api_key&.data_observatory_permissions?
        end

        def check_licensing_enabled
          raise UnauthorizedError.new('DO licensing not enabled') unless @user.has_feature_flag?('do-licensing')
        end

        def bq_subscriptions
          redis_key = "do:#{@user.username}:datasets"
          redis_value = $users_metadata.hget(redis_key, BIGQUERY_KEY) || '[]'
          JSON.parse(redis_value)
        end

        def present_subscriptions(subscriptions)
          enriched_subscriptions = subscriptions.map do |subscription|
            qualified_id = subscription['dataset_id']
            project, dataset, table = qualified_id.split('.')
            # FIXME: better save the type in Redis or look for it in the metadata tables
            type = table.starts_with?('geography') ? 'geography' : 'dataset'
            { project: project, dataset: dataset, table: table, id: qualified_id, type: type }
          end
          enriched_subscriptions.select! { |subscription| subscription[:type] == @type } if @type
          ordered_subscriptions = enriched_subscriptions.sort_by { |subscription| subscription[@order] }
          @direction == :asc ? ordered_subscriptions : ordered_subscriptions.reverse
        end

        def subscription_metadata
          metadata_user = ::User.where(username: 'do-metadata').first
          raise Carto::LoadError.new('No Data Observatory metadata found') unless metadata_user

          query = "SELECT * FROM #{TABLES_BY_TYPE[@type]} WHERE id = '#{@id}'"
          result = metadata_user.in_database[query].first
          raise Carto::LoadError.new("No metadata found for #{@id}") unless result

          result
        end
      end
    end
  end
end
