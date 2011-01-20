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
Table.create :user_id => user.id, :privacy => Table::PUBLIC, :name => 'Foursq check-ins'
Table.create :user_id => user.id, :privacy => Table::PRIVATE, :name => 'Downloaded movies'

table = Table[1]

100.times do
  table.execute_sql("INSERT INTO #{table.db_table_name} (Name,Location,Description) VALUES ('#{String.random(10)}','#{rand(1000000.0)}','#{String.random(100)}')")
end

user = User.order(:id).last
Table.create :user_id => user.id, :privacy => Table::PUBLIC, :name => 'Twitter followers'
Table.create :user_id => user.id, :privacy => Table::PRIVATE, :name => 'Recipes'