from chardet.universaldetector import UniversalDetector
import os.path
import sys
import dbfUtils
import sys
from osgeo import osr
from urllib import urlencode
from urllib2 import urlopen
import json
import subprocess

shp_file = sys.argv[1]
name = sys.argv[2]

dbf_file = shp_file[0:-4] + '.dbf'
prj_file = shp_file[0:-4] + '.prj'

srid = 4326
#Try detecting the SRID
if os.path.isfile(prj_file):
  prj_filef = open(prj_file, 'r')
  prj_txt = prj_filef.read()
  prj_filef.close()
  srs = osr.SpatialReference()
  srs.ImportFromESRI([prj_txt])
  srs.AutoIdentifyEPSG()
  code = srs.GetAuthorityCode(None)
  if code:
    srid = code
  else:
    #Ok, no luck, lets try with the OpenGeo service
    try:
      query = urlencode({
          'exact' : True,
          'error' : True,
          'mode' : 'wkt',
          'terms' : prj_txt})
      webres = urlopen('http://prj2epsg.org/search.json', query)
      jres = json.loads(webres.read())
      if jres['codes']:
        srid = int(jres['codes'][0]['code'])
    except:
      srid=4326 # ensure set back to 4326 whatever happens    
          
try:
    #Try to detect the encoding
    dbf = open(dbf_file, 'rb')
    db = dbfUtils.dbfreader(dbf)
    detector = UniversalDetector()
    for row in db:
      detector.feed(str(row))
      if detector.done: break
    detector.close()
    dbf.close()
    encoding = detector.result["encoding"]
    if encoding=="ascii":
        encoding="LATIN1"
except:
    #if encoding detection fails, attempt default UTF8
    encoding = "UTF8"

print "%s,%s,%s,%s" % (srid,encoding,shp_file,name)
