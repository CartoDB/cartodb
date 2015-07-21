# coding: UTF-8

class UserNotifications < Sequel::Model
  include CartoDB::MiniSequel

  many_to_one :user

end

