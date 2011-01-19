class Table < Sequel::Model(:user_tables)

  PRIVATE = 0
  PUBLIC  = 1

  def public?
    privacy && privacy == PUBLIC
  end

  def private?
    privacy.nil? || privacy == PRIVATE
  end

end
