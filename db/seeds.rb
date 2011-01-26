# coding: UTF-8

## Remove all user databases

tables = Rails::Sequel.connection.tables
Rails::Sequel.connection[tables.first].with_sql(
  "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_dev_user_%'"
).map(:datname).each { |user_database_name| Rails::Sequel.connection.run("drop database #{user_database_name}") }
Rails::Sequel.connection[tables.first].with_sql(
  "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
).map(:datname).each { |user_database_name| Rails::Sequel.connection.run("drop database #{user_database_name}") }

## Create users

User.create :email => 'admin@example.com', :password => 'example'
User.create :email => 'user1@example.com', :password => 'user1'

## Development demo data

user = User.first
table = Table.new :privacy => Table::PUBLIC, :name => 'Foursq check-ins',
                  :tags => '4sq, personal'
table.user_id = user.id
table.save

table = Table.new :privacy => Table::PRIVATE, :name => 'Downloaded movies',
                  :tags => 'movies, personal'
table.user_id = user.id
table.save

table = Table[1]

100.times do
  table.execute_sql("INSERT INTO \"#{table.name}\" (Name,Location,Description) VALUES ('#{String.random(10)}','#{Point.from_x_y(rand(10.0), rand(10.0)).as_ewkt}','#{String.random(100)}')")
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