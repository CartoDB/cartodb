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

## Development demo data

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

table = Table.new :privacy => Table::PRIVATE, :name => 'Downloaded movies',
                  :tags => 'movies, personal'
table.user_id = user.id
table.force_schema = "name varchar, address varchar, latitude float, longitude float"
table.save
table.set_lan_lon_columns!(:latitude, :longitude)

user.run_query("INSERT INTO #{table.name}  (name, address, latitude, longitude) values ('#{String.random(15)}','Calle Santa Ana 1, 3C, Madrid',#{rand(100000).to_f / 100.0},#{rand(100000).to_f / 100.0})"   )
user.run_query("INSERT INTO #{table.name}  (name, address, latitude, longitude) values ('#{String.random(15)}','Calle Hortaleza 48, Madrid',#{rand(100000).to_f / 100.0},#{rand(100000).to_f / 100.0})"      )
user.run_query("INSERT INTO #{table.name}  (name, address, latitude, longitude) values ('#{String.random(15)}','Calle de la Villa, 2, Madrid',#{rand(100000).to_f / 100.0},#{rand(100000).to_f / 100.0})"    )
user.run_query("INSERT INTO #{table.name}  (name, address, latitude, longitude) values ('#{String.random(15)}','Calle Pilar Marti 16, Burjassot',#{rand(100000).to_f / 100.0},#{rand(100000).to_f / 100.0})" )
user.run_query("INSERT INTO #{table.name}  (name, address, latitude, longitude) values ('#{String.random(15)}','Calle San Vicente 16, Valencia',#{rand(100000).to_f / 100.0},#{rand(100000).to_f / 100.0})" )

table = Table.new :privacy => Table::PUBLIC, :name => 'My favourite bars',
                  :tags => 'bars, personal'
table.user_id = user.id
table.save

user = User.order(:id).last
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