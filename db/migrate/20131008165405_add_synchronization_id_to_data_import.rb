# encoding: utf-8

class AddSynchronizationIdToDataImport < Sequel::Migration
  def up
    add_column :data_imports, :synchronization_id, :bigint
  end

  def down
    drop_column :data_imports, :synchronization_id
  end
end
