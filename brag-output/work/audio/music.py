import numpy as np, wave, sys
SR=44100; DUR=14.0; N=int(SR*DUR); BEAT=0.5
t=np.arange(N)/SR
out=np.zeros((2,N))
def hz(m): return 440*2**((m-69)/12)
def add(sig,start,gain=1.0,pan=0.0):
    i=int(start*SR); j=min(N,i+len(sig))
    if j<=i: return
    l=np.sqrt(0.5*(1-pan)); r=np.sqrt(0.5*(1+pan))
    out[0,i:j]+=sig[:j-i]*gain*l; out[1,i:j]+=sig[:j-i]*gain*r
# chords (midi) per bar of 2s: Am F C G Am F C
chords=[[57,60,64],[53,57,60],[48,55,60],[55,59,62],[57,60,64],[53,57,60],[48,55,60]]
roots=[45,41,48,43,45,41,48]
# pad
for b,ch in enumerate(chords):
    L=2.6; tt=np.arange(int(L*SR))/SR
    env=np.minimum(1,tt/0.35)*np.where(tt>2.0,np.exp(-(tt-2.0)/0.25),1)
    for k,m in enumerate(ch):
        f=hz(m); s=np.zeros_like(tt)
        for h,a in [(1,1),(2,.35),(3,.15),(4,.06)]:
            s+=a*(np.sin(2*np.pi*f*h*tt)+np.sin(2*np.pi*f*h*1.004*tt+1))/2
        add(s*env,b*2.0,0.05,pan=(k-1)*0.4)
# pluck arpeggio 8ths
for i in range(int(DUR/0.25)):
    st=i*0.25; b=min(int(st//2),6); ch=chords[b]
    m=ch[[0,1,2,1][i%4]]+12
    L=0.6; tt=np.arange(int(L*SR))/SR
    s=(np.sin(2*np.pi*hz(m)*tt)+0.3*np.sin(4*np.pi*hz(m)*tt))*np.exp(-tt/0.16)*np.minimum(1,tt/0.004)
    g=0.035 if st<6 else 0.05
    if st>=10.5: g=0.06
    add(s,st,g,pan=0.3*(-1)**i)
# scene 4 shimmer 16ths high
for i in range(int(10.5/0.125),int(DUR/0.125)):
    st=i*0.125; ch=chords[min(int(st//2),6)]
    m=ch[i%3]+24; tt=np.arange(int(0.4*SR))/SR
    s=np.sin(2*np.pi*hz(m)*tt)*np.exp(-tt/0.08)*np.minimum(1,tt/0.003)
    add(s,st,0.018,pan=0.6*np.sin(i))
# bass from 6s
for i in range(int(6/BEAT),int(DUR/BEAT)):
    st=i*BEAT; b=min(int(st//2),6); f=hz(roots[b]-12)
    tt=np.arange(int(0.48*SR))/SR
    s=np.tanh(1.5*np.sin(2*np.pi*f*tt))*np.exp(-tt/0.25)*np.minimum(1,tt/0.01)
    add(s,st,0.10)
# soft kick 6..13.5
for i in range(int(6/BEAT),int(13.5/BEAT)):
    tt=np.arange(int(0.3*SR))/SR
    ph=2*np.pi*np.cumsum(45+75*np.exp(-tt/0.03))/SR
    add(np.sin(ph)*np.exp(-tt/0.12),i*BEAT,0.22)
# counter dings: global frames 195..270 step 15 -> 6.5..9.0 s, A minor pentatonic up
for k,m in enumerate([81,84,86,88,91,93]):
    tt=np.arange(int(1.4*SR))/SR; f=hz(m)
    s=(np.sin(2*np.pi*f*tt)+0.25*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt/0.15))*np.exp(-tt/0.5)*np.minimum(1,tt/0.002)
    add(s,6.5+k*BEAT,0.07+0.01*k)
# whooshes into cuts
rng=np.random.default_rng(3)
for c in [3.0,6.0,10.5]:
    L=0.6; n=rng.standard_normal(int(L*SR)); tt=np.arange(len(n))/SR
    a=np.exp(-((tt-L)/0.14)**2)  # swell toward the cut
    # moving lowpass via one-pole with rising cutoff
    y=np.zeros_like(n); prev=0
    for i in range(len(n)):
        k=0.02+0.18*(tt[i]/L); prev+=k*(n[i]-prev); y[i]=prev
    add(y*a,c-L,0.18)
# reverb: exponential-decay noise IR
ir_t=np.arange(int(1.2*SR))/SR
for ch in range(2):
    ir=rng.standard_normal(len(ir_t))*np.exp(-ir_t/0.35); ir/=np.sqrt((ir**2).sum())
    L=N+len(ir)-1; nf=1<<(L-1).bit_length()
    wet=np.fft.irfft(np.fft.rfft(out[ch],nf)*np.fft.rfft(ir,nf),nf)[:N]
    out[ch]=out[ch]+0.35*wet
# fade in/out, normalize
out*=np.minimum(1,t/0.05)*np.where(t>13.0,np.clip((14-t)/1.0,0,1),1)
out*=0.89/np.abs(out).max()
pcm=(out.T*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', np.abs(out).max())
