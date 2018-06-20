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
    $limits_metadata.LRANGE("#{map_prefix}analysis_catalog", 0, 2).should == ["1", "1", "1"]
    $limits_metadata.LRANGE("#{sql_prefix}query", 0, 2).should == ["0", "1", "2"]
    $limits_metadata.LRANGE("#{sql_prefix}query_format", 0, 2).should == ["3", "4", "5"]
    $limits_metadata.LRANGE("#{sql_prefix}job_create", 0, 2).should == ["6", "7", "8"]
    $limits_metadata.LRANGE("#{sql_prefix}job_get", 0, 2).should == ["9", "10", "11"]
    $limits_metadata.LRANGE("#{sql_prefix}job_delete", 0, 2).should == ["12", "13", "14"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_from", 0, 2).should == ["1", "1", "60"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_to", 0, 2).should == ["1", "1", "60"]
  end

  def expect_rate_limits_custom_saved_to_redis(username)
    map_prefix = "limits:rate:store:#{username}:maps:"
    sql_prefix = "limits:rate:store:#{username}:sql:"

    $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["10", "11", "12"]
    $limits_metadata.LRANGE("#{map_prefix}static", 0, 2).should == ["13", "14", "15"]
    $limits_metadata.LRANGE("#{map_prefix}static_named", 0, 2).should == ["16", "17", "18"]
    $limits_metadata.LRANGE("#{map_prefix}dataview", 0, 2).should == ["19", "110", "111"]
    $limits_metadata.LRANGE("#{map_prefix}dataview_search", 0, 2).should == ["19", "110", "111"]
    $limits_metadata.LRANGE("#{map_prefix}analysis", 0, 2).should == ["112", "113", "114"]
    $limits_metadata.LRANGE("#{map_prefix}tile", 0, 5).should == ["115", "116", "117", "230", "232", "234"]
    $limits_metadata.LRANGE("#{map_prefix}attributes", 0, 2).should == ["118", "119", "120"]
    $limits_metadata.LRANGE("#{map_prefix}named_list", 0, 2).should == ["121", "122", "123"]
    $limits_metadata.LRANGE("#{map_prefix}named_create", 0, 2).should == ["124", "125", "126"]
    $limits_metadata.LRANGE("#{map_prefix}named_get", 0, 2).should == ["127", "128", "129"]
    $limits_metadata.LRANGE("#{map_prefix}named", 0, 2).should == ["130", "131", "132"]
    $limits_metadata.LRANGE("#{map_prefix}named_update", 0, 2).should == ["133", "134", "135"]
    $limits_metadata.LRANGE("#{map_prefix}named_delete", 0, 2).should == ["136", "137", "138"]
    $limits_metadata.LRANGE("#{map_prefix}named_tiles", 0, 2).should == ["139", "140", "141"]
    $limits_metadata.LRANGE("#{map_prefix}analysis_catalog", 0, 2).should == ["11", "11", "11"]
    $limits_metadata.LRANGE("#{sql_prefix}query", 0, 2).should == ["10", "11", "12"]
    $limits_metadata.LRANGE("#{sql_prefix}query_format", 0, 2).should == ["13", "14", "15"]
    $limits_metadata.LRANGE("#{sql_prefix}job_create", 0, 2).should == ["16", "17", "18"]
    $limits_metadata.LRANGE("#{sql_prefix}job_get", 0, 2).should == ["19", "110", "111"]
    $limits_metadata.LRANGE("#{sql_prefix}job_delete", 0, 2).should == ["112", "113", "114"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_from", 0, 2).should == ["11", "11", "160"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_to", 0, 2).should == ["11", "11", "160"]
  end

  def expect_rate_limits_pro_saved_to_redis(username)
    map_prefix = "limits:rate:store:#{username}:maps:"
    sql_prefix = "limits:rate:store:#{username}:sql:"

    $limits_metadata.LRANGE("#{map_prefix}anonymous", 0, 2).should == ["1", "1", "2"]
    $limits_metadata.LRANGE("#{map_prefix}static", 0, 2).should == ["2", "4", "5"]
    $limits_metadata.LRANGE("#{map_prefix}static_named", 0, 2).should == ["3", "7", "8"]
    $limits_metadata.LRANGE("#{map_prefix}dataview", 0, 2).should == ["4", "10", "11"]
    $limits_metadata.LRANGE("#{map_prefix}dataview_search", 0, 2).should == ["4", "10", "11"]
    $limits_metadata.LRANGE("#{map_prefix}analysis", 0, 2).should == ["5", "13", "14"]
    $limits_metadata.LRANGE("#{map_prefix}tile", 0, 5).should == ["6", "16", "17", "30", "32", "34"]
    $limits_metadata.LRANGE("#{map_prefix}attributes", 0, 2).should == ["7", "19", "20"]
    $limits_metadata.LRANGE("#{map_prefix}named_list", 0, 2).should == ["8", "22", "23"]
    $limits_metadata.LRANGE("#{map_prefix}named_create", 0, 2).should == ["9", "25", "26"]
    $limits_metadata.LRANGE("#{map_prefix}named_get", 0, 2).should == ["10", "28", "29"]
    $limits_metadata.LRANGE("#{map_prefix}named", 0, 2).should == ["11", "31", "32"]
    $limits_metadata.LRANGE("#{map_prefix}named_update", 0, 2).should == ["12", "34", "35"]
    $limits_metadata.LRANGE("#{map_prefix}named_delete", 0, 2).should == ["13", "37", "38"]
    $limits_metadata.LRANGE("#{map_prefix}named_tiles", 0, 2).should == ["14", "40", "41"]
    $limits_metadata.LRANGE("#{map_prefix}analysis_catalog", 0, 2).should == ["111", "111", "111"]
    $limits_metadata.LRANGE("#{sql_prefix}query", 0, 2).should == ["1", "1", "2"]
    $limits_metadata.LRANGE("#{sql_prefix}query_format", 0, 2).should == ["2", "4", "5"]
    $limits_metadata.LRANGE("#{sql_prefix}job_create", 0, 2).should == ["3", "7", "8"]
    $limits_metadata.LRANGE("#{sql_prefix}job_get", 0, 2).should == ["4", "10", "11"]
    $limits_metadata.LRANGE("#{sql_prefix}job_delete", 0, 2).should == ["5", "13", "14"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_from", 0, 2).should == ["2", "2", "61"]
    $limits_metadata.LRANGE("#{sql_prefix}copy_to", 0, 2).should == ["2", "2", "61"]
  end

  def expect_rate_limits_exist(username)
    map_prefix = "limits:rate:store:#{username}:maps:"
    sql_prefix = "limits:rate:store:#{username}:sql:"

    $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}static").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}static_named").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}dataview").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}dataview_search").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}analysis").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}tile").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}attributes").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_list").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_create").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_get").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_update").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_delete").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}named_tiles").should eq 0
    $limits_metadata.EXISTS("#{map_prefix}analysis_catalog").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}query").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}query_format").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}job_create").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}job_get").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}job_delete").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}copy_from").should eq 0
    $limits_metadata.EXISTS("#{sql_prefix}copy_to").should eq 0
  end
end
