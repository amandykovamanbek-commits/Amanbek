// tiny static server for the film folder
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav'};
module.exports=(root,port=0)=>new Promise(res=>{const s=http.createServer((q,r)=>{const p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream'});r.end(d);});});s.listen(port,()=>res({server:s,port:s.address().port}));});
