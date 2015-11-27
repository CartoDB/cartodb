require Rails.root.join('spec/support/factories/tables')

namespace :cartodb do
  desc "Create a table with thousands of random rows"
  task :random_table_with_lots_of_rows => :environment do
    include CartoDB::Factories

    user = ::User[:username => 'admin']
    puts '========================'
    puts 'Creating random table...'
    table = create_table :user_id => user.id
    puts '...done!'

    puts 'Inserting random rows into the created table...'
    user.in_database do |user_database|
      200_000.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Name,Latitude,Longitude,Description) VALUES
                              ('#{String.random(10)}', #{Float.random_latitude}, #{Float.random_longitude}, '#{String.random(100)}')")
      end
    end
    puts '...done!'
    puts "Created random table with name #{table.name}"
    puts '========================'
  end

  desc "Imports a multi-table file"
  task :import_multitable_file => :environment do
    require_relative '../../spec/support/helpers'
    include HelperMethods

      Resque::ImporterJobs.enqueue(::User.first.id,
        'wadus',
        '/uploads/0b4186c852395c0c16b2/ESP_adm.zip',
        nil,
        nil,
        nil,
        nil,
        nil)
  end

end
