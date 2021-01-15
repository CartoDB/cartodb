require_relative '../../../helpers/file_upload'
require_relative '../../../../services/datasources/lib/datasources'
require_relative '../../../../services/platform-limits/platform_limits'
require_relative '../../../../services/importer/lib/importer/exceptions'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/url_validator'

class Api::Json::ImportsController < Api::ApplicationController
  include Carto::UUIDHelper
  include Carto::UrlValidator

  ssl_required :create
  ssl_allowed :invalidate_service_token

  # NOTE: When/If OAuth tokens management is built into the UI, remove this to send and check CSRF
  skip_before_filter :verify_authenticity_token, only: [:invalidate_service_token]

  INVALID_TOKEN_MESSAGE = 'OAuth token invalid or expired'

  # -------- Import process -------

  def create
    @stats_aggregator.timing('imports.create') do

      begin
        file_upload_helper = CartoDB::FileUpload.new(Cartodb.get_config(:importer, 'uploads_path'))

        external_source = nil
        concurrent_import_limit =
          CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                               user: current_user,
                                                                               redis: { db: $users_metadata }
                                                                             })
        raise CartoDB::Importer2::UserConcurrentImportsLimitError.new if concurrent_import_limit.is_over_limit!

        options = default_creation_options

        if params[:url].present?
          validate_url!(params.fetch(:url)) unless Rails.env.development? || Rails.env.test?
          options[:data_source] = params.fetch(:url)
        elsif params[:connector].present?
          options[:service_name] = 'connector'
          options[:service_item_id] = connector_parameters
        elsif params[:remote_visualization_id].present?
          external_source = external_source(params[:remote_visualization_id])
          options[:data_source] = external_source.import_url.presence
        else
          options = @stats_aggregator.timing('upload-or-enqueue') do
            results = file_upload_helper.upload_file_to_storage(
              filename_param: params[:filename],
              file_param: params[:file],
              request_body: request.body,
              s3_config: Cartodb.get_config(:importer, 's3')
            )

            # In Rack < 1.6 / Rails < 4, tempfiles are not inmediately cleaned (https://github.com/rack/rack/pull/671).
            # Instead they stay around until a GC cycle which can take a while in instances with low traffic.
            # This forces the tempfile to be removed right away, just after we have saved it to our storage.
            [:filename, :file].each do |param_name|
              file = params[param_name]
              file.tempfile.close! if file
            end

            # Not queued import is set by skipping pending state and setting directly as already enqueued
            options.merge({
                              data_source: results[:file_uri].presence,
                              state: results[:enqueue] ? DataImport::STATE_PENDING : DataImport::STATE_ENQUEUED
                           })
          end
        end

        # override param to store as string
        user_limits = ::JSON.dump(options[:user_defined_limits])
        data_import = @stats_aggregator.timing('save') do
          DataImport.create(options.merge!({ user_defined_limits: user_limits }))
        end

        if external_source.present?
          @stats_aggregator.timing('external-data-import.save') do
            Carto::ExternalDataImport.new(
              data_import_id: data_import.id,
              external_source_id: external_source.id
            ).save
          end
        end

        Resque.enqueue(Resque::ImporterJobs, job_id: data_import.id) if options[:state] == DataImport::STATE_PENDING

        render_jsonp({ item_queue_id: data_import.id, success: true })
      rescue CartoDB::Importer2::UserConcurrentImportsLimitError
        rl_value = decrement_concurrent_imports_rate_limit
        render_jsonp({
                       errors: { imports: "We're sorry but you're already using your allowed #{rl_value} import slots" }
                     }, 429)
      rescue StandardError => ex
        decrement_concurrent_imports_rate_limit
        log_info(message: 'Error: create', exception: ex)
        render_jsonp({ errors: { imports: ex.message } }, 400)
      end

    end
  end

  # ----------- Import OAuths Management -----------

  def invalidate_service_token
    @stats_aggregator.timing('imports.invalidate-service-token') do

      begin
        oauth = current_user.oauths.select(params[:id])
        raise CartoDB::Datasources::AuthError.new("No oauth set for service #{params[:id]}") if oauth.nil?

        datasource = oauth.get_service_datasource
        raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?
        unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
          raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
        end

        result = @stats_aggregator.timing('revoke') do
          datasource.revoke_token
        end

        if result
          @stats_aggregator.timing('remove') do
            current_user.oauths.remove(oauth.service)
          end
        end

        render_jsonp({ success: true })
      rescue StandardError => ex
        log_info(message: 'Error: invalidate_service_token', exception: ex)
        render_jsonp({ errors: { imports: ex.message } }, 400)
      end

    end
  end

  private

  def default_creation_options
    user_defined_limits = params.fetch(:user_defined_limits, {})
    # Sanitize
    user_defined_limits[:twitter_credits_limit] =
        user_defined_limits[:twitter_credits_limit].presence.nil? ? 0 : user_defined_limits[:twitter_credits_limit].to_i

    # Already had an internal issue due to forgetting to send always a string (e.g. for Twitter is an stringified JSON)
    raise "service_item_id field should be empty or a string" unless (params[:service_item_id].is_a?(String) ||
                                                                      params[:service_item_id].is_a?(NilClass))

    # Keep in sync with https://docs.carto.com/cartodb-platform/import-api.html#params
    {
      user_id:                current_user.id,
      table_name:             params[:table_name].presence,
      # Careful as this field has rules (@see DataImport data_source=)
      data_source:            nil,
      table_id:               params[:table_id].presence,
      append:                 (params[:append].presence == 'true'),
      table_copy:             params[:table_copy].presence,
      from_query:             params[:sql].presence,
      service_name:           params[:service_name].present? ? params[:service_name] : CartoDB::Datasources::Url::PublicUrl::DATASOURCE_NAME,
      service_item_id:        params[:service_item_id].present? ? params[:service_item_id] : params[:url].presence,
      type_guessing:          !["false", false].include?(params[:type_guessing]),
      quoted_fields_guessing: !["false", false].include?(params[:quoted_fields_guessing]),
      content_guessing:       ["true", true].include?(params[:content_guessing]),
      state:                  DataImport::STATE_PENDING,  # Pending == enqueue the task
      upload_host:            Socket.gethostname,
      create_visualization:   ["true", true].include?(params[:create_vis]),
      user_defined_limits:    user_defined_limits,
      privacy:                privacy,
      collision_strategy:     params[:collision_strategy]
    }
  end

  def decorate_twitter_import_data!(data, data_import)
    return if data_import.service_name != CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME

    audit_entry = Carto::SearchTweet.find_by(data_import_id: data_import.id)
    data[:tweets_georeferenced] = audit_entry.retrieved_items
    data[:tweets_cost] = audit_entry.price
    data[:tweets_overquota] = audit_entry.user.remaining_twitter_quota == 0
  end

  def decorate_default_visualization_data!(data, data_import)
    derived_vis_id = nil

    if data_import.create_visualization && !data_import.visualization_id.nil?
      derived_vis_id = data_import.visualization_id
    end

    data[:derived_visualization_id] = derived_vis_id
  end

  def external_source(remote_visualization_id)
    external_source = Carto::ExternalSource.find_by(visualization_id: remote_visualization_id)
    unless remote_visualization_id.present? && external_source.importable_by?(current_user)
      raise CartoDB::Datasources::AuthError.new('Illegal external load')
    end
    external_source
  end

  def decrement_concurrent_imports_rate_limit
    begin
      concurrent_import_limit =
        CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                             user: current_user,
                                                                             redis: {
                                                                               db: $users_metadata
                                                                             }
                                                                           })
      # It's ok to decrease always as if over limit, will get just at limit and next try again go overlimit
      concurrent_import_limit.decrement!
      concurrent_import_limit.peek  # return limit value
    rescue StandardError => e
      log_info(message: 'Error decreasing concurrent import limit', exception: e)
      nil
    end
  end

  def privacy
    if params[:privacy].present?
      privacy = Carto::UserTable::PRIVACY_VALUES_TO_TEXTS.invert[params[:privacy].downcase]
      if privacy.nil?
        valid_privacies = [
          Carto::UserTable::PRIVACY_VALUES_TO_TEXTS.values[0..-2].join(', '),
          Carto::UserTable::PRIVACY_VALUES_TO_TEXTS.values[-1]
        ].join(' and ')
        raise "Unknown value '#{params[:privacy]}' for 'privacy'. Allowed values are: #{valid_privacies}"
      elsif !current_user.valid_privacy?(privacy)
        raise "Your account type (#{current_user.account_type.tr('[]', '')}) does not allow to create private "\
               "datasets. Check https://carto.com/pricing for more info."
      end
      privacy
    end
  end

  def connector_parameters
    Carto::Connector.normalized_parameters(user: current_user, parameters: params[:connector]).to_json
  end
end
