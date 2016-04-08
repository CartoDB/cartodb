require_relative '../../../lib/carto/http/client'
require_dependency 'carto/uuidhelper'

class Superadmin::UsersController < Superadmin::SuperadminController
  include Carto::UUIDHelper

  respond_to :json

  ssl_required :show, :create, :update, :destroy, :index
  before_filter :get_user, only: [ :update, :destroy, :show, :dump, :data_imports, :data_import ]
  before_filter :get_carto_user, only: [ :synchronizations, :synchronization ]

  layout 'application'

  def show
    respond_with(@user.data({:extended => true}))
  end

  def index
    if params[:overquota].present?
      users = ::User.get_stored_overquota_users(Date.today)
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

    @user.set_fields_from_central(params[:user], :create)
    @user.enabled = true

    if @user.save
      @user.reload
      CartoDB::Visualization::CommonDataService.load_common_data(@user, self)
      @user.set_relationships_from_central(params[:user])
    end
    respond_with(:superadmin, @user)
  end

  def update
    @user.set_fields_from_central(params[:user], :update)
    @user.set_relationships_from_central(params[:user])

    @user.save
    respond_with(:superadmin, @user)
  end

  def destroy
    @user.destroy
    respond_with(:superadmin, @user)
  rescue => e
    Rollbar.report_message('Error destroying user', 'error', { error: e.inspect, user: @user.inspect })
    render json: { "error": "Error destroying user: #{e.message}" }, status: 422
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
    respond_with(@user.data_imports_dataset.map { |entry|
      {
        id: entry.id,
        data_type: entry.data_type,
        date: entry.updated_at,
        status: entry.success.nil? ? false : entry.success
      }
    })
  end

  def data_import
    data_import = DataImport[params[:data_import_id]]
    respond_with({
                   data: data_import.to_hash,
                   log: data_import.nil? ? nil : data_import.log.to_s
                 })
  end

  def synchronizations
    respond_with(@user.synchronizations.map { |entry|
      {
        id: entry.id,
        data_type: entry.service_name,
        date: entry.updated_at,
        status: entry.success?
      }
    })
  end

  def synchronization
    synchronization = Carto::Synchronization.where(id: params[:synchronization_id]).first
    respond_with({
                   data: synchronization.to_hash,
                   log: synchronization.nil? ? nil : synchronization.log.to_s
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

end # Superadmin::UsersController
