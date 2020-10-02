namespace :cartodb do
  namespace :db do
    desc 'Moves left-over tables from failed imports from the public to the cdb_importer schema'
    task cleanup_importer_tables: :environment do
      count = ::User.count
      ::User.all.each_with_index do |user, index|
        puts "Cleaning up importer tables for #{user.username}"
        begin
          user.in_database.fetch(%(
            SELECT table_name FROM information_schema.tables
            AS table_name
            WHERE table_schema = 'public'
            AND table_name ~ 'importer_\\w{32}'
          )).map do |record|
            @table_name = record.fetch(:table_name)
            user.in_database.run(%{
              DROP TABLE IF EXISTS "cdb_importer"."#{@table_name}"
            })
            user.in_database.run(%{
              ALTER TABLE "public"."#{@table_name}"
              SET SCHEMA "cdb_importer"
            })
            puts "------ moved #{@table_name} from user #{user.username}"
          end
          printf "OK %-20s (%-4s/%-4s)\n", user.username, index, count
        rescue StandardError => e
          printf "FAIL %-20s (%-4s/%-4s) #{e.message}\n", user.username, index, count
        end
        sleep(1.0 / 5.0)
      end
    end
  end
end
