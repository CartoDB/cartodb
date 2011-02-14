# coding: UTF-8

class APIKey < Sequel::Model(:api_keys)

  def user
    User[:id => user_id]
  end

end