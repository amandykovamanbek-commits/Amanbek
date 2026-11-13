const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/index.html?render=1');
const r=await p.evaluate(()=>{const c=document.getElementById('c').getContext('2d');const out={};const T=(n,f)=>{const s=performance.now();for(let i=0;i<5;i++)f();c.getImageData(0,0,1,1);out[n]=((performance.now()-s)/5).toFixed(1)};
T('elder',()=>person(c,ELDER(0,500,1500,1,{t:3,...POSE.pockets(3)})));
T('elderSit',()=>person(c,ELDER(0,500,1500,1,{t:3,...POSE.sit(3)})));
T('thug',()=>person(c,THUG2(0,500,1500,1,{t:3})));
T('building',()=>building(c,-300,1250,700,900,{floors:9,cols:6,col:PAL.panel2,seed:33,lit:.5}));
T('blurBuilding',()=>blurred(c,2,()=>building(c,-300,1250,700,900,{floors:9,cols:6,col:PAL.panel2,seed:33,lit:.5})));
T('garages',()=>garages(c,-100,1500,6));T('graffiti',()=>graffiti(c,380,1360,1,1,'#e0e0e0'));T('sky',()=>sky(c));T('ground',()=>ground(c,1500));
return out});console.log(r);await b.close()})()
