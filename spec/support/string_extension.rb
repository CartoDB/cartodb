class String
  
  @@chars ||= ('a'..'z').to_a + ('A'..'Z').to_a
  
  def self.random(size = 8)
    (0..size).map{ @@chars[rand(@@chars.length)] }.join
  end
  
end