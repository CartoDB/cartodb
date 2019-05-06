class AddPeriodEndDateToUsers < Sequel::Migration
  def up
    alter_table :users do
      add_column :period_end_date, DateTime
      set_column_default :period_end_date, Sequel.function(:now)
    end
  end #up

  def down
    alter_table :users do
      drop_column :period_end_date
    end
  end #down
end
