class SynchronizationsMigration < Sequel::Migration
  def up
    create_table :synchronizations do
      String    :id,        null: false, primary_key: true
      String    :name,      text: true
      Integer   :interval
      String    :url,       text: true    
      String    :state
      Integer   :user_id
      DateTime  :created_at, null: false
      DateTime  :updated_at, null: false
      DateTime  :run_at
      DateTime  :runned_at
      Integer   :retried_times
    end
  end

  def down
    drop_table :synchronizations
  end
end

