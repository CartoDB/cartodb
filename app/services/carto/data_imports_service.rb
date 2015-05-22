require_relative '../../helpers/carto/uuidhelper'

module Carto

  class DataImportsService
    include Carto::UUIDHelper

    def initialize(users_metadata = $users_metadata)
      @users_metadata = users_metadata
    end
    
    def process_recent_user_imports(user)
      imports = DataImportQueryBuilder.new.with_user(user).with_state_not_in([Carto::DataImport::STATE_COMPLETE, Carto::DataImport::STATE_FAILURE]).with_created_at_after(Time.now - 24.hours).with_order(:created_at, :desc).build.all

      running_ids = running_import_ids

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

    def process_by_id(id)
      return nil if !is_uuid?(id)

      import = Carto::DataImport.where(id: id).first

      if stuck?(import)
        # INFO: failure because of stuck is handled with old model
        ::DataImport[id].mark_as_failed_if_stuck!
      end
      import
    rescue RecordNotFound => e
      nil
    end

    private

    def stuck?(import)
      # TODO: this kind of method is in the service because it requires communication with external systems (resque). Anyway, should some logic (state check, for example) be inside the model?
      ![Carto::DataImport::STATE_ENQUEUED, Carto::DataImport::STATE_PENDING, Carto::DataImport::STATE_COMPLETE, Carto::DataImport::STATE_FAILURE].include?(import.state) &&
      import.created_at < 5.minutes.ago &&
      !running_import_ids.include?(self.id)
    end

    def running_import_ids
      Resque::Worker.all.map { |worker| worker.job["payload"]["args"].first["job_id"] rescue nil }.compact
    end

  end

end
