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
table = Table.new :privacy => Table::PUBLIC, :name => 'Foursq check-ins',
                  :tags => '4sq, personal'
table.user_id = user.id
table.force_schema = "name varchar(255), surname varchar(255), address varchar(255), city varchar(255), country varchar(255), nif varchar(255), age integer, twitter_account varchar(255), postal_code integer"
table.save

100.times do
  user.run_query("INSERT INTO #{table.name}  (name, surname, address, city, country , nif , age , twitter_account , postal_code) values ('#{String.random(15)}','#{String.random(15)}','#{String.random(30)}','#{String.random(10)}','#{String.random(20)}','#{String.random(20)}',#{rand(100)},'#{String.random(10)}',#{rand(10000)})" )
end

table = Table.new :privacy => Table::PRIVATE, :name => 'Downloaded movies',
                  :tags => 'movies, personal'
table.user_id = user.id
table.save

table = Table.new :privacy => Table::PUBLIC, :name => 'My favourite bars',
                  :tags => 'bars, personal'
table.user_id = user.id
table.save

20.times do
  t = Table.new :name => "Table #{rand(1000)}"
  t.user_id = user.id
  t.save
end

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