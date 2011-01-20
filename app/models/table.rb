# coding: UTF-8

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  ## Callbacks

  # Before creating a user table a table should be created in the database.
  # This table has an empty schema
  def before_create
    update_updated_at
    unless self.user_id.blank? || self.name.blank?
      self.db_table_name = self.name.sanitize.tr('-','_')
      unless self.db_table_name.blank?
        owner.in_database do |user_database|
          unless user_database.table_exists?(self.db_table_name.to_sym)
            user_database.create_table self.db_table_name.to_sym
          end
        end
      end
    end
    super
  end
  ## End of Callbacks

  def public?
    privacy && privacy == PUBLIC
  end

  def private?
    privacy.nil? || privacy == PRIVATE
  end

  def execute_sql(sql)
    update_updated_at!
    owner.in_database do |user_database|
      user_database[db_table_name.to_sym].with_sql(sql).all
    end
  end

  def rows_count
    owner.in_database do |user_database|
      user_database[db_table_name.to_sym].count
    end
  end

  private

  def update_updated_at
    self.updated_at = Time.now
  end

  def update_updated_at!
    update_updated_at && save
  end

  def owner
    @owner ||= User.select(:id,:database_name).filter(:id => self.user_id).first
  end

end
