module Carto
  class SubscriptionNotFoundError < StandardError
    def initialize(username, subscription_id)
      super "Subscription not found with id #{subscription_id} for user #{username}"
    end
  end
  class EntityNotFoundError < StandardError
    def initialize(entity_id)
      super "Entity not found with id #{entity_id}"
    end
  end

  module Api
    module Public
      class DataObservatoryController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_filters, only: [:subscriptions]
        before_action :load_id, only: [:subscription, :update_subscription, :subscription_info, :subscribe, :unsubscribe]
        before_action :load_type, only: [:subscription, :update_subscription, :subscription_info, :subscribe]
        before_action :load_http_client, only: [:subscription_info, :subscribe]
        before_action :check_api_key_permissions
        before_action :check_do_enabled, only: [:subscription, :update_subscription, :subscription_info, :subscriptions]

        setup_default_rescues
        rescue_from Carto::SubscriptionNotFoundError, with: :rescue_from_subscription_not_found
        rescue_from Carto::EntityNotFoundError, with: :rescue_from_entity_not_found

        rescue_from Carto::SubscriptionNotFoundError, with: :rescue_from_subscription_not_found
        rescue_from Carto::EntityNotFoundError, with: :rescue_from_entity_not_found

        respond_to :json

        HTTP_CLIENT_TAG = 'do_api'.freeze

        VALID_TYPES = %w(dataset geography).freeze
        VALID_STATUSES = %w(active requested).freeze
        DATASET_REGEX = /[\w\-]+\.[\w\-]+\.[\w\-]+/.freeze
        VALID_ORDER_PARAMS = %i(created_at id table dataset project type).freeze
        METADATA_FIELDS = %i(id estimated_delivery_days subscription_list_price tos tos_link licenses licenses_link
                             rights type).freeze
        TABLES_BY_TYPE = { 'dataset' => 'datasets', 'geography' => 'geographies' }.freeze
        REQUIRED_METADATA_FIELDS = %i(available_in estimated_delivery_days subscription_list_price).freeze
        DEFAULT_DELIVERY_DAYS = 3.0

        def token
          response = Cartodb::Central.new.get_do_token(@user.username)
          render(json: response)
        end

        def subscriptions
          bq_subscriptions = Carto::DoLicensingService.new(@user.username).subscriptions
          bq_subscriptions = bq_subscriptions.select { |sub| sub[:status] == @status } if @status.present?

          response = present_subscriptions(bq_subscriptions)
          render(json: { subscriptions: response })
        end

        def subscription
          bq_subscription = Carto::DoLicensingService.new(@user.username).subscription(@id)
          render(json: bq_subscription)
        end

        def update_subscription
          allowed_params = params.slice(:full_access_status_bq, :full_access_status_azure, :full_access_status_aws)
          return render_jsonp({ errors: 'Unexpected params received' }, 400) if allowed_params.empty?

          updated_subscription = Carto::DoLicensingService.new(@user.username).update(@id, allowed_params)
          DataObservatoryMailer.carto_full_access_request(@user, @id).deliver_now
          db_type_requested = to_db_type_requested(params)
          properties = {
            user_id: current_viewer.id,
            dataset_id: @id,
            db_type: db_type_requested
          }
          Carto::Tracking::Events::DoFullAccessRequest.new(current_viewer.id, properties).report
          render(json: updated_subscription)
        end

        def to_db_type_requested(params)
          db_type_requested = case
                              when params[:full_access_status_bq] == 'requested'
                                'bq'
                              when params[:full_access_status_azure] == 'requested'
                                'azure'
                              when params[:full_access_status_aws] == 'requested'
                                'aws'
                              else
                                nil
                              end
        end

        def subscription_info
          response = present_metadata(subscription_metadata(@id, @type))

          render(json: response)
        end

        def subscribe
          metadata = subscription_metadata(@id, @type)

          if metadata[:is_public_data] == true || instant_licensing_available?(metadata)
            instant_license(metadata)
          else
            regular_license(metadata)
          end

          response = present_metadata(metadata)
          render(json: response)
        end

        def instant_licensing_available?(metadata)
          @user.has_feature_flag?('do-instant-licensing') &&
            REQUIRED_METADATA_FIELDS.all? { |field| metadata[field].present? } &&
            metadata[:estimated_delivery_days].zero?
        end

        def instant_license(metadata)
          licensing_service = Carto::DoLicensingService.new(@user.username)
          licensing_service.subscribe(license_info(metadata, 'active'))
        end

        def regular_license(metadata)
          DataObservatoryMailer.carto_request(@user, metadata[:id], metadata[:estimated_delivery_days]).deliver_now
          licensing_service = Carto::DoLicensingService.new(@user.username)
          licensing_service.subscribe(license_info(metadata, 'requested'))
        end

        def unsubscribe
          Carto::DoLicensingService.new(@user.username).unsubscribe(@id)

          head :no_content
        end

        def entity_info
          doss = Carto::DoSyncServiceFactory.get_for_user(@user)
          info = doss.entity_info(params[:entity_id])
          raise Carto::EntityNotFoundError.new(params[:entity_id]) if info[:error].present?
          render json: info
        end

        def sync_info
          check_subscription!
          render json: Carto::DoSyncServiceFactory.get_for_user(@user).sync(params[:subscription_id])
        end

        def create_sync
          check_subscription!
          render json: Carto::DoSyncServiceFactory.get_for_user(@user).create_sync!(params[:subscription_id], true)
        end

        def destroy_sync
          check_subscription!
          Carto::DoSyncServiceFactory.get_for_user(@user).remove_sync!(params[:subscription_id])
          head :no_content
        end

        def create_sample
           Carto::DoSampleServiceFactory.get_for_user(@user).import_sample!(params[:dataset_id])
          head :no_content
        end

        private

        def check_subscription!
          if @user.do_subscription(params[:subscription_id]).blank?
            raise Carto::SubscriptionNotFoundError.new(@user.username, params[:subscription_id])
          end
        end

        def rescue_from_subscription_not_found(exception)
          render_jsonp({ errors: exception.message }, 404)
        end

        def rescue_from_entity_not_found(exception)
          render_jsonp({ errors: exception.message }, 404)
        end

        def load_http_client
          @client = Carto::Http::Client.get(HTTP_CLIENT_TAG, log_requests: true)
        end

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_filters
          _, _, @order, @direction = page_per_page_order_params(
            VALID_ORDER_PARAMS, default_order: 'created_at', default_order_direction: 'asc'
          )
          @status = VALID_STATUSES.include?(params[:status]) ? params[:status] : nil
          load_type(required: false)
        end

        def load_id
          @id = params[:id] || params[:subscription_id]
          raise ParamInvalidError.new(:id) unless @id =~ DATASET_REGEX
        end

        def load_type(required: true)
          @type = params[:type]
          id = params[:id] || params[:subscription_id]
          if @type.nil? && !(id.nil?) then
            # If we don't have the type, we can figure it out from the id:
            doss = Carto::DoSyncServiceFactory.get_for_user(@user)
            parsed_entity_id = doss.parsed_entity_id(id)
            @type = parsed_entity_id[:type]
          end
          return if @type.nil? && !required

          raise ParamInvalidError.new(:type, VALID_TYPES.join(', ')) unless VALID_TYPES.include?(@type)
        end

        def check_api_key_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key&.master? || api_key&.data_observatory_permissions?
        end

        def check_do_enabled
          @user.do_enabled?
        end

        def rescue_from_central_error(exception)
          log_rescue_from(__method__, exception)

          render_jsonp({ errors: exception.errors }, 500)
        end

        def present_subscriptions(subscriptions)
          if @type.present?
            subscriptions = subscriptions.select { |subscription| subscription[:type] == @type }
          end

          ordered_subscriptions = subscriptions.sort_by { |subscription| subscription[@order] || subscription['id'] }
          @direction == :asc ? ordered_subscriptions : ordered_subscriptions.reverse
        end

        def present_metadata(metadata)
          metadata[:estimated_delivery_days] = present_delivery_days(metadata[:estimated_delivery_days])
          metadata.slice(*METADATA_FIELDS)
        end

        def present_delivery_days(delivery_days)
          return DEFAULT_DELIVERY_DAYS if delivery_days&.zero? && !@user.has_feature_flag?('do-instant-licensing')

          delivery_days
        end

        def subscription_metadata(dataset_id, type)
          request = request_subscription_metadata(dataset_id, type)

          raise Carto::LoadError, "No metadata found for #{dataset_id}" if request.nil?

          payload = request.with_indifferent_access

          {
            id: dataset_id,
            name: payload[:name],
            provider_name: payload[:provider_name],
            type: type,
            is_public_data: payload[:is_public_data],
            geography_id: payload[:geography_id],
            available_in: payload[:available_in] || [],
            published_in_web: payload[:published_in_web],
            subscription_list_price: payload[:subscription_list_price]&.to_f,
            estimated_delivery_days: payload[:estimated_delivery_days]&.to_f,
            tos: payload[:tos],
            tos_link: payload[:tos_link],
            licenses: payload[:licenses],
            licenses_link: payload[:licenses_link],
            rights: payload[:rights]
          }.symbolize_keys
        end

        def request_subscription_metadata(dataset_id, type)
          do_meta_config = Cartodb.config[:do_metadata_api]

          base_url = "#{do_meta_config['scheme']}://#{do_meta_config['host']}:#{do_meta_config['port']}"
          src_endpoint = TABLES_BY_TYPE[type]

          url = "#{base_url}/api/v4/data/observatory/metadata/#{src_endpoint}/#{dataset_id}"

          response = @client.get(url, timeout: 3)
          JSON.parse(response.body)
        end

        def license_info(metadata, status)
          doss = Carto::DoSyncServiceFactory.get_for_user(@user)
          entity_info = doss.parsed_entity_id(metadata[:id])
          # 'requested' datasets may no exists yet in 'bq', but let's assume it will...
          available_in = (metadata[:available_in].blank? && status == 'requested') ? ['bq'] : metadata[:available_in]
          entity_info.merge({
            dataset_id: metadata[:id],
            available_in: available_in,
            price: metadata[:subscription_list_price],
            created_at: entity_info[:created_at] || Time.now.round,
            expires_at: entity_info[:expires_at] || Time.now.round + 1.year,
            status: status
          })
        end
      end
    end
  end
end
