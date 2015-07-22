# coding: UTF-8

class UserNotification < Sequel::Model
  include CartoDB::MiniSequel

  many_to_one :user

end

