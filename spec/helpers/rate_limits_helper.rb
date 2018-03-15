# TODO use this extensively in the user and rate_limit specs
module RateLimitsHelper
  def expect_rate_limits_saved_to_redis(username)
    map_prefix = "limits:rate:store:#{username}:maps:"
    sql_prefix = "limits:rate:store:#{username}:sql:"

    $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["0", "1", "2"]
    $limits_metadata.LRANGE("#{map_prefix}static", 0, 2).should == ["3", "4", "5"]
    $limits_metadata.LRANGE("#{map_prefix}static_named", 0, 2).should == ["6", "7", "8"]
    $limits_metadata.LRANGE("#{map_prefix}dataview", 0, 2).should == ["9", "10", "11"]
    $limits_metadata.LRANGE("#{map_prefix}dataview_search", 0, 2).should == ["9", "10", "11"]
    $limits_metadata.LRANGE("#{map_prefix}analysis", 0, 2).should == ["12", "13", "14"]
    $limits_metadata.LRANGE("#{map_prefix}tile", 0, 5).should == ["15", "16", "17", "30", "32", "34"]
    $limits_metadata.LRANGE("#{map_prefix}attributes", 0, 2).should == ["18", "19", "20"]
    $limits_metadata.LRANGE("#{map_prefix}named_list", 0, 2).should == ["21", "22", "23"]
    $limits_metadata.LRANGE("#{map_prefix}named_create", 0, 2).should == ["24", "25", "26"]
    $limits_metadata.LRANGE("#{map_prefix}named_get", 0, 2).should == ["27", "28", "29"]
    $limits_metadata.LRANGE("#{map_prefix}named", 0, 2).should == ["30", "31", "32"]
    $limits_metadata.LRANGE("#{map_prefix}named_update", 0, 2).should == ["33", "34", "35"]
    $limits_metadata.LRANGE("#{map_prefix}named_delete", 0, 2).should == ["36", "37", "38"]
    $limits_metadata.LRANGE("#{map_prefix}named_tiles", 0, 2).should == ["39", "40", "41"]
    $limits_metadata.LRANGE("#{sql_prefix}query", 0, 2).should == ["0", "1", "2"]
    $limits_metadata.LRANGE("#{sql_prefix}query_format", 0, 2).should == ["3", "4", "5"]
    $limits_metadata.LRANGE("#{sql_prefix}job_create", 0, 2).should == ["6", "7", "8"]
    $limits_metadata.LRANGE("#{sql_prefix}job_get", 0, 2).should == ["9", "10", "11"]
    $limits_metadata.LRANGE("#{sql_prefix}job_delete", 0, 2).should == ["12", "13", "14"]
  end
end
