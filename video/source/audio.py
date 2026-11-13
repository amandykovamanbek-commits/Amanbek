import numpy as np, wave
SR=44100; DUR=27.0; N=int(SR*DUR)
L=np.zeros(N); Rr=np.zeros(N)
rng=np.random.default_rng(3)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); s=sig[:max(0,N-i)]
    L[i:i+len(s)]+=s*g*(1-pan)/1; Rr[i:i+len(s)]+=s*g*(1+pan)/1
def env(n,a=0.005,r=0.2):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*np.exp(-t/r); return e
def lp(x,k):  # one-pole lowpass
    y=np.zeros_like(x); acc=0.0
    a=k
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def kick():
    n=int(.45*SR);t=np.arange(n)/SR;f=45+120*np.exp(-t*30);ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)*1.0
def clap():
    n=int(.25*SR);x=rng.standard_normal(n);x=x-lp(x,0.15);return x*env(n,0.002,0.06)*0.35
def hat():
    n=int(.06*SR);x=rng.standard_normal(n);x=np.diff(np.concatenate([[0],x]));return x*env(n,0.001,0.015)*0.18
def note(f,d,amp=0.1,harm=(1,.5,.33,.25,.2)):
    n=int(d*SR);t=np.arange(n)/SR;s=sum(a*np.sin(2*np.pi*f*h*t)*(1 if h==1 else 1) for h,a in enumerate(harm,1))
    e=np.minimum(1,t/0.25)*np.minimum(1,(d-t)/0.4).clip(0,1)
    return s*e*amp
mid=lambda m:440*2**((m-69)/12)
bpm=100;beat=60/bpm;bar=4*beat
chords=[[57,60,64],[53,57,60],[48,52,55,60],[55,59,62]]  # Am F C G
bass=[45,41,36,43]
t=0.0;bi=0
while t<DUR:
    ch=chords[bi%4]
    for m in ch: add(note(mid(m),bar+0.3,0.045),t,1,(m%3-1)*0.2)
    add(note(mid(bass[bi%4]),bar,0.12,(1,.3,.1)),t)
    t+=bar;bi+=1
# drums 2.6-22.0
t=2.6
while t<22.0:
    for b in range(4):
        tb=t+b*beat
        if tb>=22.0:break
        add(kick(),tb,0.9)
        if b in(1,3):add(clap(),tb,1)
        sub=4 if 12.2<=tb<17.0 else 2
        for h in range(sub): add(hat(),tb+h*beat/sub,1,0.3)
    t+=bar
# sfx
def whoosh(d=0.45,up=True):
    n=int(d*SR);x=rng.standard_normal(n);tt=np.linspace(0,1,n)
    k=0.02+0.3*(tt if up else 1-tt); y=np.zeros(n);acc=0
    for i in range(n): acc+=k[i]*(x[i]-acc); y[i]=acc
    return y*np.sin(np.pi*tt)**2*0.9
for c in [2.6,7.4,12.2,17.0,22.0]: add(whoosh(),c-0.25,1.2)
def click():
    n=int(.08*SR);t=np.arange(n)/SR;return (np.sin(2*np.pi*1800*t)*0.4+rng.standard_normal(n)*0.3)*np.exp(-t*80)*0.5
for i in range(4): add(click(),0.55+i*0.28,1,(i-1.5)*0.3); add(note(mid(69+[0,3,7,12][i]),0.6,0.08,(1,.2)),0.55+i*0.28)
def pop():
    n=int(.12*SR);t=np.arange(n)/SR;f=500+900*t/0.12;return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*30)*0.35
for b in [3.3,5.75,8.0,10.7,12.8,15.5,17.6,19.1]: add(pop(),b)
def thud():
    n=int(.5*SR);t=np.arange(n)/SR;x=np.sin(2*np.pi*(60+40*np.exp(-t*20))*t)*np.exp(-t*9);nz=lp(rng.standard_normal(n),0.05)*np.exp(-t*12)
    return x*0.9+nz*1.5
add(thud(),5.48,1.1); add(thud(),14.8,0.9)
def shutter():
    n=int(.05*SR);return rng.standard_normal(n)*env(n,0.001,0.008)*0.25
for i in range(14): add(shutter(),2.8+rng.random()*2.4,1,rng.random()-0.5)
# sparkle chimes talent
for i,m in enumerate([76,79,83,88,83,79]): add(note(mid(m),0.4,0.04,(1,)),7.6+i*0.25)
# power-down obs
n=int(0.7*SR);tt=np.arange(n)/SR;f=600*np.exp(-tt*3);add(np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*np.exp(-tt*2)*0.06,14.55)
# finish ding + cheer
for m in [72,76,79,84]: add(note(mid(m),1.6,0.07,(1,.4,.1)),20.75)
n=int(2.2*SR);tt=np.arange(n)/SR;cr=lp(rng.standard_normal(n),0.25)*np.minimum(1,tt/0.2)*np.exp(-tt*1.2)*0.5;add(cr,20.75,1)
# final hit
for m in [45,57,64,69]: add(note(mid(m),2.5,0.06,(1,.5,.3)),24.2)
add(kick(),24.2,1.0)
mix=np.stack([L,Rr],1)
fade=np.ones(N);fo=int(0.8*SR);fade[-fo:]=np.linspace(1,0,fo);mix*=fade[:,None]
mix/=np.abs(mix).max()*1.12
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype(np.int16).tobytes())
print('ok')
