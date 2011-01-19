# coding: UTF-8

User.create :email => 'admin@example.com', :password => 'example'

## Development demo data

user = User.first

Table.create :user_id => user.id, :privacy => Table::PUBLIC, :name => '4sq check-ins'

Table.create :user_id => user.id, :privacy => Table::PRIVATE, :name => 'Downloaded movies'