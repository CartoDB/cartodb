require_relative '../../../lib/carto/http/client'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/overquota_users_service'
require_dependency 'carto/api/paged_searcher'
require './lib/carto/user_creator'
require './lib/carto/user_updater'

class Superadmin::UsersController < Superadmin::SuperadminController
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher

  respond_to :json

  ssl_required :show, :index
  before_action :get_user, only: [:show, :dump, :data_imports, :data_import]
  before_action :get_carto_user, only: [:synchronizations, :synchronization, :geocodings, :geocoding]

  rescue_from Carto::ParamInvalidError, with: :rescue_from_carto_error

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
    elsif params[:account_type].present? && params[:state].present?
      users = ::User.where(account_type: params[:account_type], state: params[:state])
      if params[:page].present?
        page, per_page = page_per_page_params
        users = users.limit(per_page).offset((page - 1) * per_page)
      end
      respond_with(:superadmin, users.map(&:activity))
    else
      users = ::User.all
      respond_with(:superadmin, users.map(&:data))
    end
  end

  def dump
    database_port = Cartodb.get_config(:users_dumps, 'service', 'port')
    raise "There is not a dump method configured" unless database_port

    json_data = {database: @user.database_name, username: @user.username}
    http_client = Carto::Http::Client.get(self.class.name, log_requests: true)
    response = http_client.request(
      "#{@user.database_host}:#{database_port}/scripts/db_dump",
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
    page, per_page, order, _order_direction = page_per_page_order_params(VALID_ORDER_PARAMS)
    dataset = @user.data_imports_dataset.order(Sequel.desc(order)).paginate(page, per_page)

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
    page, per_page, order, _order_direction = page_per_page_order_params(VALID_ORDER_PARAMS)
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
    page, per_page, order, _order_direction = page_per_page_order_params(VALID_ORDER_PARAMS)
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

    @user = if uuid?(id)
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

end # Superadmin::UsersController
