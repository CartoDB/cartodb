FactoryBot.define do
  factory :connection, class: Carto::Connection do
    initialize_with { Carto::Connection.send :new }

    # # connection_type Carto::Connection::TYPE_DB_CONNECTOR,
    # name { unique_name('db connection') }
    # parameters { }
  end
  factory :db_connection, class: Carto::Connection do
    initialize_with { Carto::Connection.send :new }

    # connection_type Carto::Connection::TYPE_DB_CONNECTOR,
    name { unique_name('db connection') }
    parameters { }
  end
end
