class Layer < Sequel::Model
  plugin :serialization, :json, :options
  plugin :single_table_inheritance, :kind

  many_to_many :maps
  plugin :association_dependencies, :maps => :nullify
end
