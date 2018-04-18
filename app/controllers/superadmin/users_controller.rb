require_relative '../../../lib/carto/http/client'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/overquota_users_service'
require_dependency 'carto/api/paged_searcher'

class Superadmin::UsersController < Superadmin::SuperadminController
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher
  include Carto::ControllerHelper

  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index
  before_filter :get_user, only: [:update, :destroy, :show, :dump, :data_imports, :data_import]
  before_filter :get_carto_user, only: [:synchronizations, :synchronization, :geocodings, :geocoding]

  rescue_from Carto::OrderParamInvalidError, with: :rescue_from_carto_error

  layout 'application'

  VALID_ORDER_PARAMS = [:updated_at].freeze

  def show
    respond_with(@user.data({:extended => true}))
  end

  def index
    if params[:overquota].present?
      users = Carto::OverquotaUsersService.new.get_stored_overquota_users
      respond_with(:superadmin, users)
    elsif params[:db_size_in_bytes_change].present?
      # This use case is specific: we only return cached db_size_in_bytes, which is
      # much faster and doesn't add load to the database.
      username_dbsize = Carto::UserDbSizeCache.new.db_size_in_bytes_change_users
      respond_with(:superadmin, username_dbsize.map do |username, db_size_in_bytes|
        { 'username' => username, 'db_size_in_bytes' => db_size_in_bytes }
      end) and return
    else
      users = ::User.all
      respond_with(:superadmin, users.map(&:data))
    end
  end

  def create
    @user = ::User.new

    user_param = params[:user]
    @user.set_fields_from_central(user_param, :create)
    @user.enabled = true

    @user.rate_limit_id = create_rate_limits(user_param[:rate_limit]).id if user_param[:rate_limit].present?
    if @user.save
      @user.reload
      CartoDB::Visualization::CommonDataService.load_common_data(@user, self) if @user.should_load_common_data?
      @user.set_relationships_from_central(user_param)
    end
    CartoGearsApi::Events::EventManager.instance.notify(
      CartoGearsApi::Events::UserCreationEvent.new(
        CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_SUPERADMIN, @user
      )
    )
    respond_with(:superadmin, @user)
  end

  def update
    user_param = params[:user]
    @user.set_fields_from_central(user_param, :update)
    @user.set_relationships_from_central(user_param)
    @user.regenerate_api_key(user_param[:api_key]) if user_param[:api_key].present?

    @user.update_rate_limits(user_param[:rate_limit])
    @user.save
    respond_with(:superadmin, @user)
  end

  def destroy
    @user.set_force_destroy if params[:force] == 'true'
    @user.destroy
    respond_with(:superadmin, @user)
  rescue CartoDB::SharedEntitiesError => e
    render json: { "error": "Error destroying user: #{e.message}", "errorCode": "userHasSharedEntities" }, status: 422
  rescue => e
    CartoDB::Logger.error(exception: e, message: 'Error destroying user', user: @user)
    render json: { "error": "Error destroying user: #{e.message}", "errorCode": "" }, status: 422
  end

  def dump
    if Cartodb.config[:users_dumps].nil? || Cartodb.config[:users_dumps]["service"].nil? || Cartodb.config[:users_dumps]["service"]["port"].nil?
      raise "There is not a dump method configured"
    end
    json_data = {database: @user.database_name, username: @user.username}
    http_client = Carto::Http::Client.get(self.class.name, log_requests: true)
    response = http_client.request(
      "#{@user.database_host}:#{Cartodb.config[:users_dumps]["service"]["port"]}/scripts/db_dump",
      method: :post,
      headers: { "Content-Type" => "application/json" },
      body: json_data.to_json
    ).run
    parsed_response = JSON.parse(response.body)
    if response.code == 200 &&
       parsed_response['retcode'] == 0 &&
       !parsed_response['return_values']['local_file'].nil? &&
       !parsed_response['return_values']['local_file'].empty? &&
       !parsed_response['return_values']['remote_file'].nil? &&
       !parsed_response['return_values']['remote_file'].empty?
      sa_response = {
        :dumper_response => parsed_response,
        :remote_file => parsed_response['remote_file'],
        :local_file => parsed_response['local_file'],
        :database_host => @user.database_host
      }
      render json: sa_response, status: 200
    else
      sa_response = {
        :dumper_response => parsed_response
      }
      render json: sa_response, status: 400
    end
  end

  def data_imports
    page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)
    dataset = @user.data_imports_dataset.order(order.desc).paginate(page, per_page)

    dataset = dataset.where(state: params[:status]) if params[:status].present?
    total_entries = dataset.pagination_record_count

    data_imports_info = dataset.map do |entry|
      {
        id: entry.id,
        data_type: entry.data_type,
        date: entry.updated_at,
        status: entry.success.nil? ? false : entry.success,
        state: entry.state
      }
    end

    respond_with({ total_entries: total_entries }.merge(data_imports: data_imports_info))
  end

  def data_import
    data_import = DataImport[params[:data_import_id]]
    respond_with({
                   data: data_import.to_hash,
                   log: data_import.nil? ? nil : data_import.log.to_s
                 })
  end

  def geocodings
    page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)
    dataset = @user.geocodings.order("#{order} desc")

    dataset = dataset.where(state: params[:status]) if params[:status].present?
    total_entries = dataset.count

    geocodings_info = dataset.limit(per_page).offset((page - 1) * per_page).map do |entry|
      {
        id: entry.id,
        date: entry.updated_at,
        status: entry.state
      }
    end
    respond_with({ total_entries: total_entries }.merge(geocodings: geocodings_info))
  end

  def geocoding
    geocoding = @user.geocodings.find(params[:geocoding_id])
    respond_with(data: geocoding.attributes, log: geocoding && geocoding.log.to_s)
  end

  def synchronizations
    page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)
    dataset = @user.synchronizations.order("#{order} desc")

    dataset = dataset.where(state: params[:status]) if params[:status].present?
    total_entries = dataset.count

    synchronizations_info = dataset.limit(per_page).offset((page - 1) * per_page).map do |entry|
      {
        id: entry.id,
        data_type: entry.service_name,
        date: entry.updated_at,
        status: entry.success?,
        state: entry.state
      }
    end
    respond_with({ total_entries: total_entries }.merge(synchronizations: synchronizations_info))
  end

  def synchronization
    synchronization = Carto::Synchronization.where(id: params[:synchronization_id]).first
    respond_with({
                   data: synchronization.to_hash,
                   log: synchronization.nil? ? nil : synchronization.log.try(:entries)
                 })
  end

  private

  def get_user
    id = params[:id]

    @user = if is_uuid?(id)
              ::User[params[:id]]
            else
              ::User.where(username: id).first
            end

    render json: { error: 'User not found' }, status: 404 unless @user
  end

  def get_carto_user
    @user = Carto::User.where(id: params[:id]).first
    render json: { error: 'User not found' }, status: 404 unless @user
  end

  def create_rate_limits(rate_limit_attributes)
    rate_limit = Carto::RateLimit.from_api_attributes(rate_limit_attributes)
    rate_limit.save!
    rate_limit
  end

end # Superadmin::UsersController
