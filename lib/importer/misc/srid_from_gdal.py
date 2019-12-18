import sys
from osgeo import gdal, osr

f = sys.argv[1]
g = gdal.Open(f)
proj = g.GetProjection()
srs = osr.SpatialReference()
srs.ImportFromESRI([proj])
srs.AutoIdentifyEPSG()
srid = srs.GetAuthorityCode(None)
print("%s" %(srid))
