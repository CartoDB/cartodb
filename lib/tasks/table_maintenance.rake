namespace :cartodb do
  namespace :tables do
    namespace :maintenance do
      desc "Sync user's UserTable(s)' table_id(s) with their corresponding physical table's oid"
      task :sync_user_table_oids, [:username] => :environment do |_, args|
        raise 'A username must be provided' unless args[:username].present?

        user = ::User.where(username: args[:username]).first

        raise "No user with username '#{args[:username]}' found" if user.nil?

        user_tables = user.tables

        user_tables_count = user_tables.count
        puts "#{user_tables_count} #{'table'.pluralize(user_tables_count)} will be processed"

        synced_tables = 0
        untouched_tables = 0
        errored_tables = 0

        user_tables.each do |user_table|
          printf "\tChecking '#{user_table.name}'... \r"

          if user_table.service.fetch_table_id != user_table.table_id
            printf "\tChecking '#{user_table.name}'... needs sync!\n"
            printf "\t\tsyncing... \r"
            user_table.sync_table_id

            if user_table.save
              synced_tables += 1
              printf "\t\tsyncing... done!\n"
            else
              errored_tables += 1
              printf "\t\tsyncing... ERROR\n\n"
              puts "ATENTION: errored save for table '#{user_table.name}':"
              puts user_table.errors.full_messages
              puts "type 'continue' to proceed, anything else to abort:"

              raise 'sync aborted' if gets != 'continue'
            end
          else
            untouched_tables += 1
            printf "\tChecking '#{user_table.name}'... ok\n"
          end
        end

        puts "\n#{user_tables_count} #{'table'.pluralize(user_tables_count)} tables processed"
        puts "\t#{synced_tables} #{'table'.pluralize(synced_tables)} tables synced"
        puts "\t#{untouched_tables} #{'table'.pluralize(untouched_tables)} tables untouched"
        puts "\t#{errored_tables} #{'table'.pluralize(errored_tables)} tables errored"
      end
    end
  end
end
