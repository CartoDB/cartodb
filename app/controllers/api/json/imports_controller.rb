#encoding: UTF-8

require_relative '../../../../services/datasources/lib/datasources'
require_relative '../../../models/visualization/external_source'
require_relative '../../../../services/platform-limits/platform_limits'
require_relative '../../../../services/importer/lib/importer/exceptions'
require_relative '../../../helpers/carto/uuidhelper'

class Api::Json::ImportsController < Api::ApplicationController
  include Carto::UUIDHelper
  include FileUploadHelper

  ssl_required :index, :show, :create
  ssl_allowed :service_token_valid?, :list_files_for_service, :get_service_auth_url, :validate_service_oauth_code,
              :invalidate_service_token, :service_oauth_callback
  respond_to :html, only: [:get_service_auth_url]

  # NOTE: When/If OAuth tokens management is built into the UI, remove this to send and check CSRF
  skip_before_filter :verify_authenticity_token, only: [:invalidate_service_token, :service_oauth_callback]

  INVALID_TOKEN_MESSAGE = 'OAuth token invalid or expired'

  # -------- Import process -------

  def index
    imports = current_user.importing_jobs
    render json: { imports: imports.map(&:id), success: true }
  end

  def show
    begin
      UUIDTools::UUID.parse(params[:id])
    rescue ArgumentError
      render_404 and return
    end

    data_import = DataImport[params[:id]]
    render_404 and return if data_import.nil?

    data_import.mark_as_failed_if_stuck!

    data = data_import.reload.api_public_values
    if data_import.state == DataImport::STATE_COMPLETE
      data[:any_table_raster] = data_import.is_raster?

      decorate_twitter_import_data!(data, data_import)
      decorate_default_visualization_data!(data, data_import)
    end

    render json: data
  end

  def create
    external_source = nil

    concurrent_import_limit =
      CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                           user: current_user,
                                                                           redis: {
                                                                             db: $users_metadata
                                                                           }
                                                                         })
    if concurrent_import_limit.is_over_limit!
      raise CartoDB::Importer2::UserConcurrentImportsLimitError.new
    end

    options = default_creation_options

    if params[:url].present?
      options.merge!({
                       data_source: params.fetch(:url)
                     })
    elsif params[:remote_visualization_id].present?
      external_source = external_source(params[:remote_visualization_id])
      options.merge!( { data_source: external_source.import_url.presence } )
    else
      results = upload_file_to_storage(params, request, Cartodb.config[:importer]['s3'])
      options.merge!({
                        data_source: results[:file_uri].presence,
                        # Not queued import is set by skipping pending state and setting directly as already enqueued
                        state: results[:enqueue] ? DataImport::STATE_PENDING : DataImport::STATE_ENQUEUED
                     })
    end

    data_import = DataImport.create(options.merge!({
                                                     # override param to store as string
                                                     user_defined_limits: ::JSON.dump(options[:user_defined_limits])
                                                   }))

    if external_source.present?
      ExternalDataImport.new(data_import.id, external_source.id).save
    end

    Resque.enqueue(Resque::ImporterJobs, job_id: data_import.id) if options[:state] == DataImport::STATE_PENDING

    render_jsonp({ item_queue_id: data_import.id, success: true })
  rescue CartoDB::Importer2::UserConcurrentImportsLimitError
    rl_value = decrement_concurrent_imports_rate_limit
    render_jsonp({
                   errors: {
                              imports: "We're sorry but you're already using your allowed #{rl_value} import slots"
                           }
                 }, 429)
  rescue => ex
    decrement_concurrent_imports_rate_limit

    CartoDB::Logger.info('Error: create', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  # ----------- Import OAuths Management -----------

  def service_token_valid?
    oauth = current_user.oauths.select(params[:id])

    return render_jsonp({ oauth_valid: false, success: true }) if oauth.nil?
    datasource = oauth.get_service_datasource
    return render_jsonp({ oauth_valid: false, success: true }) if datasource.nil?
    unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
      raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
    end

    begin
      valid = datasource.token_valid?
    rescue CartoDB::Datasources::DataDownloadError
      valid = false
    end

    unless valid
      begin
        current_user.oauths.remove(params[:id])
      rescue
        # Just remove it if was present, no need to do anything
      end
    end

    render_jsonp({ oauth_valid: valid, success: true })
  rescue CartoDB::Datasources::TokenExpiredOrInvalidError => ex
    begin
      current_user.oauths.remove(ex.service_name)
    rescue
      # Just remove it if was present, no need to do anything
    end
    render_jsonp({ errors: { imports: INVALID_TOKEN_MESSAGE } }, 401)
  rescue => ex
    begin
      current_user.oauths.remove(ex.service_name)
    rescue
      # Just remove it if was present, no need to do anything
    end
    CartoDB::Logger.info('Error: service_token_valid?', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  def list_files_for_service
    # @see CartoDB::Datasources::Base::FORMAT_xxxx constants
    filter = params[:filter].present? ? params[:filter] : []

    oauth = current_user.oauths.select(params[:id])
    raise CartoDB::Datasources::AuthError.new("No oauth set for service #{params[:id]}") if oauth.nil?
    datasource = oauth.get_service_datasource
    raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?

    results = datasource.get_resources_list(filter)

    render_jsonp({ files: results, success: true })
  rescue CartoDB::Datasources::TokenExpiredOrInvalidError => ex
    current_user.oauths.remove(ex.service_name)
    render_jsonp({ errors: { imports: INVALID_TOKEN_MESSAGE } }, 401)
  rescue => ex
    CartoDB::Logger.info('Error: list_files_for_service', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  def get_service_auth_url
    oauth = current_user.oauths.select(params[:id])
    raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{params[:id]}") unless oauth.nil?

    datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(
      params[:id], current_user, {
      redis_storage: $tables_metadata,
      http_timeout: ::DataImport.http_timeout_for(current_user)
    })
    raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?
    unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
      raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
    end

    render_jsonp({
                   url: datasource.get_auth_url,
                   success: true
                 })
  rescue CartoDB::Datasources::TokenExpiredOrInvalidError => ex
    current_user.oauths.remove(ex.service_name)
    render_jsonp({ errors: { imports: INVALID_TOKEN_MESSAGE } }, 401)
  rescue => ex
    CartoDB::Logger.info('Error: get_service_auth_url', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  # Only of use if service is set to work in authorization code mode. Ignore for callback-based oauths
  def validate_service_oauth_code
        Rollbar.report_message('validate_service_oauth_code v1', 'debug')
    success = false

    oauth = current_user.oauths.select(params[:id])
    raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{params[:id]}") unless oauth.nil?

    datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(
      params[:id], current_user, {
      redis_storage: $tables_metadata,
      http_timeout: ::DataImport.http_timeout_for(current_user)
    })
    raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?
    unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
      raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
    end

    raise "Missing oauth verification code for service #{params[:id]}" unless params[:code].present?

    begin
      auth_token = datasource.validate_auth_code(params[:code])
      current_user.oauths.add(params[:id],auth_token)
      success = true
    rescue CartoDB::Datasources::AuthError
      CartoDB::Logger.info('Error: validate_service_oauth_code', \
        "Couldn't add oauth from service #{params[:id]} for user #{current_user.username}")
    end

    render_jsonp({ success: success })
  rescue CartoDB::Datasources::TokenExpiredOrInvalidError => ex
    current_user.oauths.remove(ex.service_name)
    render_jsonp({ errors: { imports: INVALID_TOKEN_MESSAGE } }, 401)
  rescue => ex
    CartoDB::Logger.info('Error: validate_service_oauth_code', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  def invalidate_service_token
    oauth = current_user.oauths.select(params[:id])
    raise CartoDB::Datasources::AuthError.new("No oauth set for service #{params[:id]}") if oauth.nil?

    datasource = oauth.get_service_datasource
    raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?
    unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
      raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
    end

    result = datasource.revoke_token
    if result
      current_user.oauths.remove(oauth.service)
    end

    render_jsonp({ success: true })
  rescue => ex
    CartoDB::Logger.info('Error: invalidate_service_token', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
  end

  def service_oauth_callback
        Rollbar.report_message('service_oauth_callback v1', 'debug')
    oauth = current_user.oauths.select(params[:id])
    raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{params[:id]}") unless oauth.nil?

    datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(
      params[:id], current_user, {
      redis_storage: $tables_metadata,
      http_timeout: ::DataImport.http_timeout_for(current_user)
    })
    raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{params[:id]}") if datasource.nil?
    unless datasource.kind_of? CartoDB::Datasources::BaseOAuth
      raise CartoDB::Datasources::InvalidServiceError.new("Datasource #{params[:id]} does not support OAuth")
    end

    token = datasource.validate_callback(params)

    current_user.oauths.add(params[:id], token)
    request.format = 'html'
    respond_to do |format|
      format.all  { render text: '<script>window.close();</script>', content_type: 'text/html' }
    end
  rescue CartoDB::Datasources::TokenExpiredOrInvalidError => ex
    current_user.oauths.remove(ex.service_name)
    render_jsonp({ errors: { imports: INVALID_TOKEN_MESSAGE } }, 401)
  rescue => ex
    CartoDB::Logger.info('Error: service_oauth_callback', "#{ex.message} #{ex.backtrace.inspect}")
    render_jsonp({ errors: { imports: ex.message } }, 400)
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

    # Keep in sync with http://docs.cartodb.com/cartodb-platform/import-api.html#params
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
      user_defined_limits:    user_defined_limits
    }
  end

  def decorate_twitter_import_data!(data, data_import)
    return if data_import.service_name != CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME

    audit_entry = ::SearchTweet.where(data_import_id: data_import.id).first
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
    external_source = CartoDB::Visualization::ExternalSource.where(visualization_id: remote_visualization_id).first
    raise CartoDB::Datasources::AuthError.new('Illegal external load') unless remote_visualization_id.present? && external_source.importable_by(current_user)
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
      concurrent_import_limit.decrement
      concurrent_import_limit.peek  # return limit value
    rescue => sub_exception
      CartoDB::Logger.info('Error decreasing concurrent import limit',
                           "#{sub_exception.message} #{sub_exception.backtrace.inspect}")
      nil
    end
  end

end
