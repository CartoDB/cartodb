# coding: UTF-8

class UserNotification < Sequel::Model

  many_to_one :user

end

