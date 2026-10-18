"""Original geometric pearl / gold / white-petal icon, no external assets."""
from PIL import Image, ImageDraw
import math
S=1024
im=Image.new('RGBA',(S,S)); d=ImageDraw.Draw(im)
for y in range(S):
 t=y/(S-1);d.line((0,y,S,y),fill=(int(243-18*t),int(236-12*t),int(228+4*t),255))
d.rounded_rectangle((38,38,986,986),radius=192,outline='#c4ab79',width=6)
d.ellipse((218,254,832,868),fill='#d1c8c4')
for r in range(294,0,-1):
 t=1-r/294;v=int(225+29*t);d.ellipse((512-r,500-r,512+r,500+r),fill=(v,min(255,v+2),min(255,v+3),255))
d.ellipse((231,219,793,781),outline='#bc9c62',width=9)
d.ellipse((300,220,724,780),outline='#ceb789',width=8)
d.polygon([(512,235),(744,635),(280,635)],outline='#b99a60',width=9)
d.arc((240,360,784,646),0,360,fill='#cfb77f',width=7)
for cx,cy,scale in [(238,738,1.0),(803,292,.68)]:
 for layer in [1,.65]:
  for k in range(7):
   a=k*math.tau/7+layer;px=cx+math.cos(a)*46*scale*layer;py=cy+math.sin(a)*46*scale*layer
   d.ellipse((px-40*scale*layer,py-62*scale*layer,px+40*scale*layer,py+62*scale*layer),fill='#fffdf5',outline='#e6ddd1',width=2)
 d.ellipse((cx-15*scale,cy-15*scale,cx+15*scale,cy+15*scale),fill='#dec996')
for x,y in [(178,296),(822,711),(689,136)]:
 d.polygon([(x,y-15),(x+5,y-5),(x+15,y),(x+5,y+5),(x,y+15),(x-5,y+5),(x-15,y),(x-5,y-5)],fill='#c7a56b')
im.resize((512,512),Image.Resampling.LANCZOS).save('build/icon.png')
im.save('build/icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
