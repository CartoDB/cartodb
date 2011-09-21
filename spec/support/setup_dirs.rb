dirs = []
dirs << Rails.root.join('public', 'uploads', 'failed_imports')

dirs.each{|dir| FileUtils.mkdir_p dir unless Dir.exist? dir}

