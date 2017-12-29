require_dependency 'carto/db/database'
require_dependency 'carto/db/connection'

class Superadmin::PlatformController < Superadmin::SuperadminController

  respond_to :json
  ssl_required :databases_info
  layout 'application'

  before_filter :check_for_database_host, only: [:database_validation]

  def databases_info
    if params[:database_host]
      hosts = [params[:database_host]]
    else
      hosts = ::User.distinct(:database_host).select(:database_host).all.map(&:database_host)
    end
    dbs = {}
    hosts.each do |h|
      total_account_types = ::User.where(database_host: h).group_and_count(:account_type).order(Sequel.desc(:count)).all
      users_in_database = ::User.where(database_host: h).count
      dbs[h] = { count: users_in_database, total_account_types_percentages: {}, total_account_types_count: {} }
      total_account_types.each do |a|
        if users_in_database.to_i > 0
          percentage = (a[:count] * 100) / users_in_database
          dbs[h][:total_account_types_percentages][a[:account_type]] = percentage
          dbs[h][:total_account_types_count][a[:account_type]] = a[:count]
        end
      end
    end
    respond_with(dbs)
  end

  def database_validation
    Carto::Db::Connection.connect(params[:database_host], 'postgres', as: :cluster_admin) do |database, _|
      db_users = database.roles
      non_carto_users = db_users.select { |r| !r.system_db_role? && !r.carto_db_role? }
      carto_users = db_users.select(&:carto_db_role?)
      connected_users = Carto::User.where(database_host: params[:database_host])
                                   .where(id: carto_users.map(&:id))
                                   .pluck(:username)
      return render json: { db_users: non_carto_users, carto_users: connected_users }
    end
  end

  def total_users
    respond_with({:count => CartoDB::Stats::Platform.new.users})
  end

  def total_pay_users
    respond_with({:count => CartoDB::Stats::Platform.new.pay_users})
  end

  def total_datasets
    respond_with({:count => CartoDB::Stats::Platform.new.datasets})
  end

  def total_seats_among_orgs
    respond_with(CartoDB::Stats::Platform.new.seats_among_orgs)
  end

  def total_shared_objects_among_orgs
    respond_with(CartoDB::Stats::Platform.new.shared_objects_among_orgs)
  end

  def total_visualizations
    respond_with({:count => CartoDB::Stats::Platform.new.visualizations})
  end

  def total_maps
    respond_with({:count => CartoDB::Stats::Platform.new.maps})
  end

  def total_active_users
    respond_with({:count => CartoDB::Stats::Platform.new.active_users})
  end

  def total_likes
    respond_with({:count => CartoDB::Stats::Platform.new.likes})
  end

  private

  def check_for_database_host
    if !params[:database_host]
      render json: { error: "Database host parameter is mandatory" }, status: 400
    end
  end

end
