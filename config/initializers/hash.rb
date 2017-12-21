class Hash
  
  def convert_nulls
    self.inject({}){|h,(k,v)| h[k] = (v == "null" ? nil : v); h }
  end
  
end