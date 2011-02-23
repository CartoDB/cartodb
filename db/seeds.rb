# coding: UTF-8

## Remove all user databases

tables = Rails::Sequel.connection.tables
Rails::Sequel.connection[
  "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_dev_user_%'"
].map(:datname).each { |user_database_name| Rails::Sequel.connection.run("drop database #{user_database_name}") }
Rails::Sequel.connection[
  "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
].map(:datname).each { |user_database_name| Rails::Sequel.connection.run("drop database #{user_database_name}") }
Rails::Sequel.connection[
  "SELECT u.usename FROM pg_catalog.pg_user u"
].map{ |r| r.values.first }.each { |username| Rails::Sequel.connection.run("drop user #{username}") if username =~ /^cartodb_user_/ }

## Create users

User.create :email => 'admin@example.com', :password => 'example', :username => 'admin'
User.create :email => 'user1@example.com', :password => 'user1',   :username => 'user1'
User.create :email => 'jmedina@vizzuality.com', :password => 'jmedina', :username => 'jmedina'

## Development demo data for admin@example.com

user = User.first

20.times do
  t = Table.new :name => "Table #{rand(1000)}"
  t.user_id = user.id
  t.save
end

table = Table.new :privacy => Table::PUBLIC, :name => 'Foursq check-ins',
                  :tags => '4sq, personal'
table.user_id = user.id
table.force_schema = "name varchar, surname varchar, address varchar, city varchar, country varchar, nif varchar, age integer, twitter_account varchar, postal_code integer"
table.save

100.times do
  user.run_query("INSERT INTO #{table.name}  (name, surname, address, city, country , nif , age , twitter_account , postal_code) values ('#{String.random(15)}','#{String.random(15)}','#{String.random(30)}','#{String.random(10)}','#{String.random(20)}','#{String.random(20)}',#{rand(100)},'#{String.random(10)}',#{rand(10000)})" )
end

table = Table.new :privacy => Table::PRIVATE, :name => 'Madrid Bars',
                  :tags => 'movies, personal'
table.user_id = user.id
table.force_schema = "name varchar, address varchar, latitude float, longitude float"
table.save
table.set_lan_lon_columns!(:latitude, :longitude)

table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9", :latitude => 40.423012, :longitude => -3.699732})
table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid", :latitude => 40.426949, :longitude => -3.708969})
table.insert_row!({:name => "El Rey del Tallarín", :address => "El Rey del Tallarín','Plaza Conde de Toreno 2, Madrid", :latitude => 40.424654, :longitude => -3.709570})
table.insert_row!({:name => "El Lacón", :address => "Plaza Conde de Toreno 2, Madrid", :latitude => 40.415113, :longitude => -3.699871})
table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid", :latitude => 40.428198, :longitude => -3.703991})

table = Table.new :privacy => Table::PUBLIC, :name => 'My favourite bars',
                  :tags => 'bars, personal'
table.user_id = user.id
table.save

## Development demo data for user1@example.com

user = User[2]

table = Table.new :privacy => Table::PUBLIC, :name => 'Twitter followers',
                  :tags => 'twitter, followers, api'
table.user_id = user.id
table.save
table = Table.new :privacy => Table::PRIVATE, :name => 'Recipes',
                  :tags => 'recipes'
table.user_id = user.id
table.save

20.times do
  t = Table.new :name => "Table #{rand(1000)}", :privacy => Table::PUBLIC
  t.user_id = user.id
  t.save
end