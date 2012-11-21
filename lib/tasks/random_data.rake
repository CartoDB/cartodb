require Rails.root.join('spec/support/factories/tables')

namespace :cartodb do
  desc "Create a table with thousands of random rows"
  task :random_table_with_lots_of_rows => :environment do
    include CartoDB::Factories

    user = User[:username => 'admin']
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
    data_import = DataImport.create(
      :user_id       => User.first.id,
      :data_source   => '/../spec/support/data/ESP_adm.zip',
      :updated_at    => Time.now )
  end

end
