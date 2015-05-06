module Carto

  class DataImportsService

    def initialize(users_metadata = $users_metadata)
      @users_metadata = users_metadata
    end
    
    def process_recent_user_imports(user)
      imports = DataImportQueryBuilder.new.with_user(user).with_state_not_in([Carto::DataImport::STATE_COMPLETE, Carto::DataImport::STATE_FAILURE]).with_created_at_after(Time.now - 24.hours).with_order(:created_at, :desc).build.all

      running_ids = running_imports_ids

      imports.map { |import|
        if import.created_at < Time.now - 60.minutes && !running_ids.include?(import.id)
          # INFO: failure is handled with old model
          ::DataImport[import.id].handle_failure
          nil
        else
          import
        end
      }.compact
    end

    private

    def running_imports_ids
      Resque::Worker.all.map { |worker| worker.job["payload"]["args"].first["job_id"] rescue nil }.compact
    end

  end

end
