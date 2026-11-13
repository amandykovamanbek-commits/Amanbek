const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/scene.html');await p.evaluate(()=>document.fonts.load('900 50px Inter'));
const fps=60,dur=await p.evaluate(()=>DUR),N=Math.round(dur*fps);
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','video.mp4'],{stdio:['pipe','inherit','inherit']});
const B=30;for(let i=0;i<N;i+=B){const n=Math.min(B,N-i);const arr=await p.evaluate(([t,n,f])=>grab(t,n,f),[i/fps,n,fps]);
for(const s of arr){const buf=Buffer.from(s,'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
if(i%600==0)console.log('frame',i,'/',N);}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done')})();
