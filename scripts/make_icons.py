from PIL import Image, ImageDraw
import os
out=os.path.join(os.path.dirname(__file__),'..','site','icons')
def icon(size, scale):
    S=size*4; im=Image.new('RGB',(S,S),'#121212'); d=ImageDraw.Draw(im)
    h=S*scale; w=h*0.58; x0=(S-w)/2; y0=(S-h)/2
    d.rounded_rectangle([x0,y0,x0+w,y0+h],radius=w*0.47,fill='#1F2937')
    r=w*0.3; cx=S/2
    for i,c in enumerate(['#EC5656','#F0A91E','#22B573']):
        cy=y0+h*(0.2+0.3*i); d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=c if i==2 else '#334155')
    return im.resize((size,size),Image.LANCZOS)
icon(192,0.72).save(out+'/icon-192.png'); icon(512,0.72).save(out+'/icon-512.png')
icon(512,0.52).save(out+'/maskable-512.png'); icon(180,0.72).save(out+'/apple-touch-icon.png')
