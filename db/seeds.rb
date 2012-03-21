# coding: UTF-8

if Rails.env.development?

  ## Remove all user databases
  tables = Rails::Sequel.connection.tables
  Rails::Sequel.connection[
    "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_dev_user_%'"
  ].map(:datname).each { |user_database_name| Rails::Sequel.connection.run("drop database #{user_database_name}") }
  Rails::Sequel.connection[
    "SELECT u.usename FROM pg_catalog.pg_user u"
  ].map{ |r| r.values.first }.each { |username| Rails::Sequel.connection.run("drop user #{username}") if username =~ /^development_cartodb_user_/ }

  ## Create users

  admin = User.new
  admin.enabled               = true
  admin.email                 = 'admin@example.com'
  admin.password              = 'example'
  admin.password_confirmation = 'example'
  admin.username              = 'admin'
  admin.admin                 = true
  admin.save

  ## Development demo data for admin@example.com

  user = User[:email => 'admin@example.com']

  2.times do
    t = Table.new :name => "Table #{rand(1000)}"
    t.user_id = user.id
    t.save
  end

  table = Table.new :privacy => Table::PUBLIC, :name => 'Foursq check-ins',
                    :tags => '4sq, personal'
  table.user_id = user.id
  table.force_schema = "name text, surname text, address text, city text, country text, nif text, age integer, twitter_account text, postal_code integer"
  table.save

  user.in_database do |user_database|
    200.times do
      user_database.run("INSERT INTO #{table.name}  (name, surname, address, city, country , nif , age , twitter_account , postal_code) values ('#{String.random(15)}','#{String.random(15)}','#{String.random(30)}','#{String.random(10)}','#{String.random(20)}','#{String.random(20)}',40.#{rand(10000)},'#{String.random(3)}',40.#{rand(10000)})" )
    end
  end

  table = Table.new :privacy => Table::PRIVATE, :name => 'Madrid Bars',
                    :tags => 'movies, personal'
  table.user_id = user.id
  table.force_schema = "name text, address text, latitude float, longitude float"
  table.save
  table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9, Madrid, Spain", :latitude => 40.423012, :longitude => -3.699732})
  table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid, Spain", :latitude => 40.426949, :longitude => -3.708969})
  table.insert_row!({:name => "El Rey del Tallarín", :address => "Plaza Conde de Toreno 2, Madrid, Spain", :latitude => 40.424654, :longitude => -3.709570})
  table.insert_row!({:name => "El Lacón", :address => "Manuel Fernández y González 8, Madrid, Spain", :latitude => 40.415113, :longitude => -3.699871})
  table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid, Spain", :latitude => 40.428198, :longitude => -3.703991})
  table.reload
  table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
end
