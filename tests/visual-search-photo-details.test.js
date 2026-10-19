// Verify Visual Search's read-only enlarged-photo detail parity.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('zm-visual-search-v2.js','utf8');
const css=fs.readFileSync('zm-visual-search-v2.css','utf8');
new vm.Script(js);
const el=()=>({
 innerHTML:'',textContent:'',href:'',title:'',hidden:true,scrollLeft:0,
 classList:{flags:new Map(),toggle(n,v){this.flags.set(n,v);}},
 querySelector(){return null;},querySelectorAll(){return [];}
});
const elems=new Map(),modal=el(),subs=new Map(),listeners=new Map(),keyboard=[];
const parent=el(),root=el();
parent.querySelector=q=>q==='#zmwm-visual-root'?root:null;
root.addEventListener=(name,fn,capture)=>{
 const all=listeners.get(name)||[];all.push({fn,capture:!!capture});listeners.set(name,all);
};
root.querySelector=q=>elems.get(q.slice(1))||null;
elems.set('zm-visual-search-root',parent);
elems.set('zmwm-visual-root',root);
for(const id of ['zmwm-visual-feedback','zmwm-visual-results',
 'zmwm-visual-material-options','zmwm-visual-type-options',
 'zmwm-visual-material-summary','zmwm-visual-type-summary',
 'zmwm-visual-material-filter','zmwm-visual-type-filter'])elems.set(id,el());
for(const key of ['#zmwm-visual-lightbox-title','#zmwm-visual-lightbox-meta',
 '#zmwm-visual-lightbox-record-link','#zmwm-visual-lightbox-status',
 '#zmwm-visual-lightbox-details','#zmwm-visual-lightbox-image',
 '#zmwm-visual-lightbox-caption','#zmwm-visual-lightbox-thumbnails',
 '[data-visual-action="download-photo"]','[data-visual-action="previous-photo"]',
 '[data-visual-action="next-photo"]',
 '[data-visual-action="close-photo"].zmwm-visual-lightbox-close',
 '.zmwm-visual-lightbox-panel'])subs.set(key,el());
modal.querySelector=q=>subs.get(q)||null;
elems.set('zmwm-visual-lightbox',modal);
subs.get('[data-visual-action="close-photo"].zmwm-visual-lightbox-close').focus=()=>{};
const record=(id,type,material,sale,rack,note,pictures)=>Object.fromEntries(
 Object.entries({$id:String(id),color_combined:'Stone '+id,color:'Stone '+id,zmv_num:'',
  type,material,sale_status:sale,rack,job:'Herman & Family',in_out_note:note,
  length:'124',width:'62',shape:'Rectangle',length_2:'',width_2:'',
  exact_picture:pictures,example_picture:[]}).map(([k,v])=>[k,{value:v}]));
const records=[
 record(1,'Stock Slab','Quartz','Avl','Z-1A','',[]),
 record(2,'SO-Slab','Marble','SOLD','Z-5A','Keep upright & watch <edges>.',
  [{fileKey:'a',name:'a.jpg',contentType:'image/jpeg'},
   {fileKey:'b',name:'b.jpg',contentType:'image/jpeg'}]),
 record(3,'Cosigned Slab','Granite','Hold','Z-6B','',[]),
 record(4,'STOCK Rem','Quartz','Avl','Z-4A','',[]),
 record(5,'Stan-Rem','Marble','Avl','Z-3A','',[])
];
const registrations=[];
const api=async (url,method,options)=>{
 assert.equal(method,'GET');
 assert.equal(options.app,6);
 return {records};
};
api.url=s=>s;
class XHR{
 open(m,u){assert.equal(m,'GET');}
 setRequestHeader(){}
 send(){Promise.resolve().then(()=>{this.status=200;this.response={type:'image/jpeg'};this.onload();});}
 abort(){}
}
const context={
 console,kintone:{api,events:{on(names,fn){registrations.push(fn);}}},
 window:{kintone:{}},XMLHttpRequest:XHR,
 URL:{createObjectURL(){return 'blob:fixture';},revokeObjectURL(){}},
 document:{
  getElementById(id){return elems.get(id)||null;},
  addEventListener(name,fn){if(name==='keydown')keyboard.push(fn);},
  removeEventListener(){},
  createElement(){return el();}
 }
};
vm.runInNewContext(js,context);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const piece=(html,type,cls)=>assert.ok(
 html.includes('class="zmwm-visual-piece-type '+cls+'">'+type+'</span>'),
 'Missing color-coded '+type);
(async()=>{
 registrations[0]({viewName:'Visual Search',viewType:'custom'});
 await tick();
 const html=elems.get('zmwm-visual-results').innerHTML;
 piece(html,'Stock Slab','type-stock-slab');
 piece(html,'SO-Slab','type-so-slab');
 piece(html,'Cosigned Slab','type-consigned-slab');
 piece(html,'STOCK Rem','type-stock-rem');
 piece(html,'Stan-Rem','type-standard-rem');
 const adjacent='class="zmwm-visual-material">Marble</span>'+
   '<span class="zmwm-visual-rack">Rack: Z-5A</span>';
 assert.ok(html.includes(adjacent),'Rack must sit right of material at same prominence');
 assert.match(parent.innerHTML,/class="zmwm-visual-lightbox-content"/);
 assert.match(parent.innerHTML,/id="zmwm-visual-lightbox-details"/);
 const button={dataset:{visualId:'2'},isConnected:true,focus(){}};
 const e={target:{closest:s=>s.startsWith('.zmwm-visual-photo-action')?button:null},
  preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
 listeners.get('click').find(e=>e.capture).fn(e);
 assert.equal(modal.hidden,false);
 assert.equal(subs.get('#zmwm-visual-lightbox-title').textContent,'Stone 2');
 assert.equal(subs.get('#zmwm-visual-lightbox-meta').textContent,'Record #2');
 assert.equal(subs.get('#zmwm-visual-lightbox-record-link').href,'/k/6/show#record=2');
 const details=subs.get('#zmwm-visual-lightbox-details').innerHTML;
 piece(details,'SO-Slab','type-so-slab');
 assert.ok(details.includes(adjacent));
 assert.match(details,/124 × 62 in/);
 assert.match(details,/SOLD TO \/ JOB/);
 assert.match(details,/Herman &amp; Family/);
 assert.match(details,/IN \/ OUT NOTES/);
 assert.match(details,/Keep upright &amp; watch &lt;edges&gt;\./);
 assert.doesNotMatch(details,/<edges>/);
 assert.match(subs.get('#zmwm-visual-lightbox-status').innerHTML,
  /class="zmwm-visual-status sold">SOLD<\/span>/);
 assert.equal(subs.get('.zmwm-visual-lightbox-panel').classList.flags.get('is-sold'),true);
 await tick();
 assert.match(subs.get('#zmwm-visual-lightbox-image').innerHTML,/<img /);
 keyboard[0]({key:'ArrowRight',preventDefault(){}});
 assert.match(subs.get('#zmwm-visual-lightbox-caption').textContent,/Photo 2 of 2/);
 assert.equal(subs.get('#zmwm-visual-lightbox-details').innerHTML,details);
 keyboard[0]({key:'Escape',preventDefault(){}});
 assert.equal(modal.hidden,true);
 for(const cls of ['type-stock-slab','type-so-slab','type-consigned-slab',
  'type-stock-rem','type-standard-rem'])
  assert.ok(css.includes('.zmwm-visual-piece-type.'+cls),'No CSS for '+cls);
 assert.match(css,/\.zmwm-visual-lightbox-info/);
 assert.match(css,/\.zmwm-visual-rack/);
 console.log('Photo viewer: colored type, adjacent rack, status, dimensions, job, notes, photos and close passed.');
})().catch(err=>{console.error(err);process.exitCode=1;});
