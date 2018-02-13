require_dependency 'carto/uuidhelper'

module Carto

  class DataImportsService
    include Carto::UUIDHelper

    def initialize(users_metadata = $users_metadata, tables_metadata = $tables_metadata)
      @users_metadata = users_metadata
      @tables_metadata = tables_metadata
    end

    def process_recent_user_imports(user)
      imports = DataImportQueryBuilder.new.with_user(user).with_state_not_in([Carto::DataImport::STATE_COMPLETE, Carto::DataImport::STATE_FAILURE]).with_created_at_after(Time.now - 24.hours).with_order(:created_at, :desc).build.all

      running_ids = running_import_ids

      imports.map { |import|
        if import.created_at < Time.now - 60.minutes && !running_ids.include?(import.id)
          # INFO: failure is handled with old model
          ::DataImport[import.id].handle_failure(CartoDB::Importer2::StuckImportJobError.new)
          nil
        else
          import
        end
      }.compact
    end

    def process_by_id(id)
      return nil if !is_uuid?(id)

      import = Carto::DataImport.where(id: id).first

      if stuck?(import)
        # INFO: failure because of stuck is handled with old model
        ::DataImport[id].mark_as_failed_if_stuck!
        # INFO: avoiding `reload` usage because of #7718
        import = Carto::DataImport.where(id: id).first
      end
      import
    rescue RecordNotFound => e
      nil
    end

    def validate_synchronization_oauth(user, service)
      oauth = user.oauth_for_service(service)
      return false unless oauth

      datasource = oauth.get_service_datasource

      begin
        valid = datasource.token_valid?
      rescue => e
        delete_oauth_if_expired_and_raise(user, e, oauth)
        valid = false
      end

      unless valid
        delete_oauth(user, oauth)
      end

      valid
    rescue => e
      delete_oauth_if_expired_and_raise(user, e, oauth)
    end

    def get_service_files(user, service, filter)
      oauth = user.oauth_for_service(service)
      raise CartoDB::Datasources::AuthError.new("No oauth set for service #{service}") if oauth.nil?
      datasource = oauth.get_service_datasource
      datasource.get_resources_list(filter)
    rescue => e
      delete_oauth_if_expired_and_raise(user, e, oauth)
    end

    def get_service_auth_url(user, service)
      oauth = user.oauth_for_service(service)
      raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{service}") if oauth

      get_datasource(user, service).get_auth_url
    end

    def validate_service_oauth_code(user, service, code)
      oauth = user.oauth_for_service(service)
      raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{service}") if oauth

      datasource = get_datasource(user, service)
      begin
        auth_token = datasource.validate_auth_code(code)
        user.add_oauth(service, auth_token)
        return true
      rescue CartoDB::Datasources::AuthError => e
        CartoDB.notify_exception(e, { message: "Error while validating code #{code}, it won't be stored", user: user, service: service })
        return false
      end
    rescue => e
      delete_oauth_if_expired_and_raise(user, e, oauth)
    end

    def validate_callback(user, service, params)
      oauth = user.oauth_for_service(service)
      raise CartoDB::Datasources::AuthError.new("OAuth already set for service #{service}") if oauth
      datasource = get_datasource(user, service)

      token = datasource.validate_callback(params)

      # TODO: workaround for https://github.com/CartoDB/cartodb/issues/4003
      #user.add_oauth(service, datasource.validate_callback(params))
      CartoDB::OAuths.new(::User.where(id: user.id).first).add(service, token)
    rescue => e
      delete_oauth_if_expired_and_raise(user, e, oauth)
    end

    private

    def get_datasource(user, service)
      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(service, user, {
        redis_storage: @tables_metadata,
        http_timeout: ::DataImport.http_timeout_for(user)
      })
      raise CartoDB::Datasources::AuthError.new("Couldn't fetch datasource for service #{service}") if datasource.nil?
      datasource
    end

    def delete_oauth(user, oauth)
      # INFO: this is the straightforward way, but sometimes it fails with "ActiveRecord::StatementInvalid: PG::Error: ERROR:  prepared statement "a1" does not exist" errors
      # user.synchronization_oauths.delete(oauth)
      oauth.destroy
      user.synchronization_oauths.delete(oauth)
    end

    def delete_oauth_if_expired_and_raise(user, e, oauth = nil)
      CartoDB.notify_exception(e, { message: 'Error while processing datasource', user: user, oauth: oauth })
      if e.kind_of?(CartoDB::Datasources::TokenExpiredOrInvalidError) && oauth
        delete_oauth(user, oauth)
      end

      raise e
    end

    def stuck?(import)
      # TODO: this kind of method is in the service because it requires communication with external systems (resque). Anyway, should some logic (state check, for example) be inside the model?
      ![Carto::DataImport::STATE_ENQUEUED, Carto::DataImport::STATE_PENDING, Carto::DataImport::STATE_COMPLETE, Carto::DataImport::STATE_FAILURE].include?(import.state) &&
      import.created_at < 5.minutes.ago &&
      !running_import_ids.include?(import.id)
    end

    def running_import_ids
      Resque::Worker.all.map { |worker| worker.job["payload"]["args"].first["job_id"] rescue nil }.compact
    end

  end

end
