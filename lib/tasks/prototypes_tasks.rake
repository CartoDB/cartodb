namespace :cartodb do
  namespace :prototypes do
    desc 'Generates data for Madrid Clubbing prototype'
    task :import_madrid_clubbing => :environment do
      puts "Creating table 'Clubbing Madrid'"
      puts "Importing the data..."
      user = ::User[1]
      table = Table.new :privacy => Table::PRIVACY_PUBLIC, :name => 'Clubbing Madrid',
                        :tags => 'bars, madrid'
      table.user_id = user.id
      table.import_from_file = File.open("#{Rails.root}/db/fake_data/clubbing.csv", "r")
      table.save
      puts "Geocoding all this data..."
      puts "Go go go!"
      table.set_address_column!(:direccion_completa)
    end
  end
end