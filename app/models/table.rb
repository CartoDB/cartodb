# coding: UTF-8

class UserTableAlreadyExist < StandardError; end

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # DB table preffix
  DB_TABLE_PREFFIX = 'users_tables_'

  ## Callbacks

  # Before creating a user table a table should be created in the database.
  # This table has an empty schema
  def before_create
    unless self.user_id.blank? || self.name.blank?
      self.db_table_name = DB_TABLE_PREFFIX + self.user_id.to_s + '_' + self.name.sanitize.tr('-','_')
      unless self.db_table_name.blank?
        unless Rails::Sequel.connection.table_exists?(self.db_table_name.to_sym)
          Rails::Sequel.connection.create_table self.db_table_name.to_sym
        else
          raise UserTableAlreadyExist
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
    Rails::Sequel.connection[db_table_name.to_sym].with_sql(sql).all
  end

  def rows_count
    Rails::Sequel.connection[db_table_name.to_sym].count
  end

end
