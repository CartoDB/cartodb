module Resque
  module ImporterJobs
    @queue = :import_jobs

    def self.before_perform

    end

    def self.perform(table)
      table.save!
    end

    def self.after_perform

    end

  end
end
