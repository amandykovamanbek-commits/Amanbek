import numpy as np, wave
SR=44100; T=64.0; n=int(SR*T); t=np.arange(n)/SR
rng=np.random.default_rng(1)
# dark drone: two low sines with slow swell + filtered noise
drone=0.5*np.sin(2*np.pi*55*t)+0.35*np.sin(2*np.pi*82.4*t+0.5)+0.2*np.sin(2*np.pi*110.3*t)
drone*=0.6+0.4*np.sin(2*np.pi*t/7.0)
noise=rng.standard_normal(n); k=np.ones(400)/400; noise=np.convolve(noise,k,'same')*6
bed=(drone+noise)*0.06
bed*=np.clip(t/2,0,1)*np.clip((T-t)/2,0,1)
# heartbeat-ish pulse in the last part (hospital / doctor)
for b in np.arange(47.0,62.0,0.9):
    i=int(b*SR); m=int(0.18*SR); e=np.exp(-np.linspace(0,9,m))
    bed[i:i+m]+=0.22*np.sin(2*np.pi*48*np.arange(m)/SR)*e
# impacts
for imp in [0.65,20.48,28.64,41.49,43.52,44.16,45.36,55.76]:
    i=int(imp*SR); m=int(0.9*SR); tt=np.arange(m)/SR
    f=60*np.exp(-tt*4)+35
    thump=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*5)
    crack=rng.standard_normal(m)*np.exp(-tt*35)*0.5
    bed[i:i+m]+=0.55*(thump+crack)
# whooshes on cuts
for c in [4.5,12.6,16.0,24.2,30.5,42.4,46.6,54.8]:
    i=int((c-0.35)*SR); m=int(0.5*SR); env=np.sin(np.linspace(0,np.pi,m))**2
    w=np.convolve(rng.standard_normal(m),np.ones(30)/30,'same')*env*0.5
    bed[i:i+m]+=w
bed=np.clip(bed,-1,1)
with wave.open('sfx.wav','w') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((bed*32767).astype(np.int16).tobytes())
print('ok')
