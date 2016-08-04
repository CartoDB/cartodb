class Superadmin::PlatformController < Superadmin::SuperadminController
  include CartoDB::SequelConnectionHelper

  respond_to :json

  ssl_required :databases_info

  layout 'application'

  def databases_info
    hosts = []
    if params[:database_host]
      hosts = [params[:database_host]]
    else
      hosts = ::User.distinct(:database_host).select(:database_host).all.collect(&:database_host)
    end
    dbs = {}
    hosts.each do |h|
      top_account_types = ::User.where(:database_host => h).group_and_count(:account_type).order(Sequel.desc(:count)).all[0..4]
      users_in_database = ::User.where(:database_host => h).count
      dbs[h] = {'count' => users_in_database, 'top_account_types_percentages' => {}}
      top_account_types.each do |a|
        percentage = (a[:count] * 100) / users_in_database
        if percentage > 1
          dbs[h]['top_account_types_percentages'][a[:account_type]] = percentage
        end
      end
    end
    respond_with(dbs)
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

  def database_host_fs_usage
    unless params[:database_host]
      respond_with({ error: %Q|Parameter 'database_host' must be supplied| },
                     status: 400)
      return
    end

    connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env)
      .merge('host' => params[:database_host],
             'database' => 'postgres'
      ) { |_, o, n| n.nil? ? o : n }
    conn = ::Sequel.connect(connection_params)
    disk_space = conn.fetch('SELECT * FROM cartodb.cdb_get_avail_disk_space();').first
    close_sequel_connection(conn)

    respond_with(disk_space)
  end

end # Superadmin::PlatformController
