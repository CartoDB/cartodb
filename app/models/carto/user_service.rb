require 'active_record'
require 'cartodb-common'
require_dependency 'carto/db/connection'

module Carto
  class UserService

    def initialize(user_model)
      @user = user_model
    end

    # TODO: Review usage to move to UserPresenter if not used anywhere else

    # Only returns owned tables (not shared ones)
    def table_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_user_id(@user.id)
                                      .with_type(Carto::Visualization::TYPE_CANONICAL)
                                      .count
    end

    def owned_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_user_id(@user.id)
                                      .with_type(Carto::Visualization::TYPE_DERIVED)
                                      .count
    end

    def visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_owned_by_or_shared_with_user_id(@user.id)
                                      .count
    end

    def public_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_public_visualizations(@user)
                                      .count
    end

    def public_privacy_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_public_privacy_visualizations(@user)
                                      .count
    end

    def public_privacy_dataset_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_public_privacy_visualizations(@user)
                                      .count
    end

    def link_privacy_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_link_privacy_visualizations(@user)
                                      .count
    end

    def password_privacy_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_password_privacy_visualizations(@user)
                                      .count
    end

    def private_privacy_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_private_privacy_visualizations(@user)
                                      .count
    end

    def all_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_all_visualizations(@user)
                                      .count
    end

    def twitter_imports_count(options={})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : @user.last_billing_cycle)
      Carto::SearchTweet.twitter_imports_count(@user.search_tweets, date_from, date_to)
    end

    # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
    # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
    # Needs to go on a background job.
    def db_size_in_bytes
      return 0 if @user.new_record?

      attempts = 0
      begin
        # Hack to support users without the new MU functiones loaded
        # TODO: Check this works as expected
        user_data_size_function = cartodb_extension_version_pre_mu? ?
          "CDB_UserDataSize()" :
          "CDB_UserDataSize('#{@user.database_schema}')"
        in_database(as: :superuser) do |user_database|
          user_database.transaction do
            user_database.execute(%{SET LOCAL lock_timeout = '1s'})
            user_database.execute(%{SELECT cartodb.#{user_data_size_function}}).first['cdb_userdatasize'].to_i
          end
        end
      rescue StandardError => e
        attempts += 1
        begin
          in_database(as: :superuser).execute("ANALYZE")
        rescue StandardError => ee
          CartoDB.report_exception(ee, "Failed to get user db size, retrying...", user: @user)
          raise ee
        end
        retry unless attempts > 1
        CartoDB.notify_exception(e, user: @user)
        # INFO: we need to return something to avoid 'disabled' return value
        nil
      end
    end

    def database_username
      if Rails.env.production?
        "cartodb_user_#{@user.id}"
      elsif Rails.env.staging?
        "cartodb_staging_user_#{@user.id}"
      else
        "#{Rails.env}_cartodb_user_#{@user.id}"
      end
    end

    def cartodb_extension_version_pre_mu?
      current_version = cartodb_extension_semver(cartodb_extension_version)
      if current_version.size == 3
        major, minor, _ = current_version
        major == 0 and minor < 3
      else
        raise 'Current cartodb extension version does not match standard x.y.z format'
      end
    end

    def database_public_username
      @user.database_schema != CartoDB::DEFAULT_DB_SCHEMA ? "cartodb_publicuser_#{@user.id}" : CartoDB::PUBLIC_DB_USER
    end

    def organization_member_group_role_member_name
      @user.in_database.execute(
        "SELECT cartodb.CDB_Organization_Member_Group_Role_Member_Name() as org_member_role;"
      ).first['org_member_role']
    end

    # Returns a tree elements array with [major, minor, patch] as in http://semver.org/
    def cartodb_extension_semver(extension_version)
      extension_version.split('.').take(3).map(&:to_i)
    end

    def cartodb_extension_version
      @cartodb_extension_version ||= in_database(:as => :superuser).execute('select cartodb.cdb_version() as v')
                                                                   .first['v']
    end

    def database_password
      Carto::Common::EncryptionService.hex_digest(@user.crypted_password) + database_username
    end

    def in_database(options = {})
      options[:username] = @user.database_username
      options[:password] = @user.database_password
      options[:user_schema] = @user.database_schema
      Carto::Db::Connection.connect(@user.database_host, @user.database_name, options) do |_, connection|
        if block_given?
          yield(connection)
        else
          connection
        end
      end
    end
  end
end
