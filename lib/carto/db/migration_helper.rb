module Carto
  module Db
    module MigrationHelper
      LOCK_TIMEOUT_MS = 1000
      MAX_RETRIES = 3
      WAIT_BETWEEN_RETRIES_S = 2

      def migration(up_block, down_block)
        Sequel.migration do
          transaction
          up do
            protected_migration(&up_block)
          end

          down do
            protected_migration(&down_block)
          end
        end
      end

      private

      def protected_migration(&block)
        run "SET lock_timeout TO #{LOCK_TIMEOUT_MS}"
        run 'SAVEPOINT before_migration'
        (1..MAX_RETRIES).each do
          begin
            instance_eval &block
            return
          rescue Sequel::DatabaseError => e
            if e.message.include?('lock timeout')
              run 'ROLLBACK TO SAVEPOINT before_migration'
              sleep WAIT_BETWEEN_RETRIES_S
            else
              raise e
            end
          end
        end
        raise 'Retries exceeded during database migration'
      ensure
        run "SET statement_timeout TO DEFAULT"
      end
    end
  end
end
