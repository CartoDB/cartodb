class Table < Sequel::Model

  PRIVATE = 0
  PUBLIC  = 1

  self.set_dataset(:user_tables)

  def public?
    privacy && privacy == PUBLIC
  end

  def private?
    privacy.nil? || privacy == PRIVATE
  end

end
