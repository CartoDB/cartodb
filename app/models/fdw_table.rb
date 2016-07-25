
require_relative './table'

class FDWTable < Table

  def before_create
    # Override to only register the table in the db, should not migrate table or create it
    self.schema(reload:true)
    set_table_id
  rescue => e
    self.handle_creation_error(e)
  end

end
