from chardet.universaldetector import UniversalDetector
import itertools
import os.path
import sys
import dbfUtils
import sys
from osgeo import osr
import json
import subprocess

if len(sys.argv) != 3:
    print("usage: python %s shp_file name" % sys.argv[0])
    sys.exit()
shp_file = sys.argv[1]
name = sys.argv[2]

dbf_file = shp_file[0:-4] + '.dbf'
prj_file = shp_file[0:-4] + '.prj'

shape_name = os.path.splitext(shp_file)[0]

def get_spatial_reference(shapefile):
    srs = osr.SpatialReference()
    shpfile = os.path.basename(shape_name)
    ret = srs.SetFromUserInput(prj_string)
    proj4 = srs.ExportToProj4()
    if not proj4:
        prj_file = open(shape_name +'.prj','r')
        prj_lines = prj_file.readlines()
        prj_file.close()
        for i in range(len(prj_lines)):
            prj_lines[i] = prj_string.rstrip( prj_lines[i] )
        srs = osr.SpatialReference()
        srs.ImportFromESRI(prj_lines)
        proj4 = srs.ExportToProj4()
        """
        if not proj4:
            #print 'Failed to convert prj of %s, giving up...' % shpfile
        else:
            #print 'Second try assuming ESRI wkt worked for %s!' % shpfile
        """
        srs.from_esri = True
    else:
        srs.from_esri = False
    srs.AutoIdentifyEPSG()
    return srs

def to_epsg(srs):
    if srs.IsGeographic():
        return srs.GetAuthorityCode('GEOGCS')
    else:
        c = srs.GetAuthorityCode('PROJCS')
        if c:
            return c
        else:
            try:
                return srs.GetAuthorityCode('GEOGCS')
            except:
                return None


srid = None

#Try detecting the SRID
if os.path.isfile(prj_file):
  prj_string = open(prj_file,'r').read()
  code = to_epsg(get_spatial_reference(shp_file))

  srid = code if code else None

try:
# Try to detect the encoding
    dbf = open(dbf_file.strip(), 'rb')
    db = dbfUtils.dbfreader(dbf)

    fnames = next(db)
    ftypes = next(db)

    # find string fields
    sfields = []
    for fno in range(len(fnames)):
      if ( ftypes[fno][0] == 'C' ) : sfields.append(fno)

    detector = UniversalDetector()

    # TODO: Make this a % of total table size and stop guessing correct values for guessing
    for row in itertools.islice(db, 1000):
      # Feed detector with concatenated string fields
      detector.feed( ''.join(row[fno] for fno in sfields) )
      if detector.done: break
    dbf.close()
    detector.close()
    encoding = detector.result["encoding"]
    confidence = detector.result["confidence"]
    if encoding=="ascii":
        encoding="LATIN1" # why not UTF8 here ?
    # There's problems detecting LATIN1 encodings, it detects KOI8-R instead of LATIN1
    if encoding=="KOI8-R":
        encoding="LATIN1"
    # Fix for #1336: since ISO-8859-2 is unlikely and UniversalDetector doesn't support ISO-8859-1, 
    # we'll fallback to ISO-8859-1 if confidence is not high
    if encoding=="ISO-8859-2" and confidence < 0.75:
        encoding="ISO-8859-1"
except Exception as err:
    encoding="None" # why not UTF8 here ?
    #sys.stderr.write(repr(err)+'\n')
    #sys.exit(1)

print("%s,%s,%s,%s" % (srid,encoding,shp_file,name))
