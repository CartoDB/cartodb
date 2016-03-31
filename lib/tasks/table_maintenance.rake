namespace :cartodb do
  namespace :tables do
    namespace :maintenance do
      desc "Sync user's UserTable(s)' table_id(s) with their corresponding physical table's oid"
      task :sync_user_table_oids, [:username] => :environment do |_, args|
        raise 'A username must be provided' unless args[:username].present?

        user = ::User.where(username: args[:username]).first

        raise "No user with username '#{args[:username]}' found" if user.nil?

        unsynced_user_tables = user.tables.select { |ut| ut.table_id != ut.service.fetch_table_id }

        user_tables_count = unsynced_user_tables.count
        puts "#{user_tables_count} #{'table'.pluralize(user_tables_count)} will be processed"

        synced_tables = 0
        errored_tables = 0

        unsynced_user_tables.each do |user_table|
          printf "\tSynching '#{user_table.name}'... \r"

          user_table.sync_table_id

          if user_table.save
            printf "\tSynching '#{user_table.name}'... ok\n"
            synced_tables += 1
          else
            printf "\tSynching '#{user_table.name}'... ok\n"
            errored_tables += 1

            puts "ATENTION: errored save for table '#{user_table.name}':"
            puts user_table.errors.full_messages
            puts "type 'continue' to proceed, anything else to abort:"

            raise 'sync aborted' if gets != 'continue'
          end
        end

        puts "\n#{user_tables_count} #{'table'.pluralize(user_tables_count)} tables processed"
        puts "\t#{synced_tables} #{'table'.pluralize(synced_tables)} tables synced"
        puts "\t#{errored_tables} #{'table'.pluralize(errored_tables)} tables errored"
      end
    end
  end
end
