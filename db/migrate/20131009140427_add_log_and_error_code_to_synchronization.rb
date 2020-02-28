class AddLogAndErrorCodeToSynchronization < Sequel::Migration
  def up
    alter_table :synchronizations do
      add_column :log_id, String
      add_column :error_code, Integer
      add_column :error_message, String, text: true
    end
  end

  def down
    alter_table :synchronizations do
      drop_column :log_id
      drop_column :error_code
      drop_column :error_message
    end
  end
end
