module Carto
  module Db
    module MigrationHelper
      LOCK_TIMEOUT_MS = 1000
      MAX_RETRIES = 3
      WAIT_BETWEEN_RETRIES_S = 2

      def migration(up_block, down_block)
        Sequel.migration do
          # Forces this migration to run under a transaction (controlled by Sequel)
          transaction

          up do
            lock_safe_migration(&up_block)
          end

          down do
            lock_safe_migration(&down_block)
          end
        end
      end

      private

      def lock_safe_migration(&block)
        run "SET lock_timeout TO #{LOCK_TIMEOUT_MS}"

        # As the external transaction is controlled by Sequel, we cannot ROLLBACK and BEGIN a new one
        # Instead, we use SAVEPOINTs (https://www.postgresql.org/docs/current/static/sql-savepoint.html)
        # to start a "sub-transaction" that we can rollback without affecting Sequel
        run 'SAVEPOINT before_migration'
        (1..MAX_RETRIES).each do
          begin
            instance_eval &block
            return
          rescue Sequel::DatabaseError => e
            if e.message.include?('lock timeout')
              # In case of timeout, we retry by reexecuting the code since the SAVEPOINT
              run 'ROLLBACK TO SAVEPOINT before_migration'
              sleep WAIT_BETWEEN_RETRIES_S
            else
              puts e.message
              raise e
            end
          end
        end

        # Raising an exception forces Sequel to rollback the entire transaction
        raise 'Retries exceeded during database migration'
      ensure
        run "SET lock_timeout TO DEFAULT"
      end
    end
  end
end
