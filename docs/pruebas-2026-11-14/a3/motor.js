const C=require('/home/claude/novoy/site/core.js'), SU=require('/home/claude/novoy/site/setup.js');
const V=require('./verdad.json');
const ROWS=[['08:00','09:00'],['09:00','10:00'],['10:00','11:00'],['11:20','12:20'],['12:20','13:20'],['13:20','14:20']];
const mk=(g)=>{const o={};Object.keys(g).forEach(d=>{const bl=[];let cur=null;g[d].forEach((s,r)=>{if(s&&cur&&cur.subject===s&&cur.end===ROWS[r][0]){cur.end=ROWS[r][1];cur.hours++}else{cur=s?{start:ROWS[r][0],end:ROWS[r][1],subject:s,hours:1}:null;if(cur)bl.push(cur)}});if(bl.length)o[d]=bl});return o};
const A={1:['ASO','ASO','ASO','SAD','SAD',null],2:['SXI','SXI','SXI','IAW','IAW','IAW'],3:['ASGBD','ASGBD','ASGBD','EIE','EIE','TUT'],4:['SAD','SAD','ASO','IAW','DIG','DIG'],5:['SXI','SXI',null,'ASGBD','ASGBD',null]};
const B={1:['SAD','SAD','SAD','ASO','ASO',null],2:['SXI','SXI','SXI','IAW','IAW','CIB'],3:['ASGBD','ASGBD','ASGBD','EIE','EIE','TUT'],4:['ASO','ASO','SAD','IAW','DIG','DIG'],5:['SXI','SXI','CIB','ASGBD','ASGBD','CIB']};
const ALL={1:Array(6).fill('PRJ'),2:Array(6).fill('PRJ'),3:Array(6).fill('PRJ'),4:Array(6).fill('PRJ'),5:Array(6).fill('PRJ')};
const base=(over={})=>Object.assign({center:'x',terms:[{id:'b1',label:'Bloque 1',from:'2026-09-14',to:'2026-12-04'},{id:'b2',label:'Bloque 2',from:'2026-12-07',to:'2027-02-12'}],
 holidays:[{from:'2026-10-12',to:'2026-10-12',label:'f'},{from:'2026-12-07',to:'2026-12-08',label:'f'},{from:'2026-12-22',to:'2027-01-07',label:'nav'}],
 schedule:mk(B),history:[{to:'2026-11-01',schedule:mk(A)}],periods:[],alias:{},totals:{},totalsUnified:{},nocount:['TUT'],disabled:{},
 project:{name:'PRJ',weeks:2,schedule:mk(ALL),ranges:[{from:'2026-10-19',to:'2026-10-23'},{from:'2027-01-18',to:'2027-01-22'}]}},over);
const SET={limite:15,justModo:'separadas',justificadasCuentan:true,limiteJust:10,retrasosPorFalta:2,semanas:33,ambito:'trimestre',aviso:2};
const startOf=(cfg,date,sub,n)=>{const sl=[];C.dayClasses(Object.assign({},cfg,{settings:SET,faltas:[]}),date).filter(b=>b.subject===sub).forEach(b=>C.hourSlots(b).forEach(x=>sl.push(x)));return sl.slice(0,n)};
function faltas(cfg){const out=[];V.F.forEach(([d,m,h,t,j],i)=>{if(t==='retraso'){const s=startOf(cfg,d,m,1)[0];out.push({id:'r'+i,date:d,subject:m,start:s&&s.start,hours:0,type:'retraso',justified:false})}else{const sl=startOf(cfg,d,m,h);if(sl.length<h)console.log('  (aviso) el motor no ve',h,'h de',m,'el',d,'-> ve',sl.length);for(let k=0;k<h;k++)out.push({id:'f'+i+'_'+k,date:d,subject:m,start:sl[k]&&sl[k].start,hours:1,type:'falta',justified:!!j})}});return out}
function run(tag,cfg,set,term='b1'){const n=C.normalize(cfg,faltas(cfg));const S=C.scope(Object.assign({},n.cfg,{settings:Object.assign({},C.DEF,set),faltas:n.faltas}));const tid=S.terms.length===1&&S.terms[0].id==='curso'?'curso':term;
 const sum=C.summary(S,tid),rem=C.remaining(S,tid,'2026-11-14');console.log('\n=== '+tag+' ===  factor*',+C.weeksFactor(S).toFixed(3),'nominal',JSON.stringify(Object.fromEntries(Object.entries(C.nominalFactors(S)).map(([k,v])=>[k,+v.toFixed(3)]))));
 const rows={};sum.forEach(x=>{const t=V.res[x.name]||{};rows[x.name]={appTotal:x.total,verdad:t.total,dTot:t.total!=null?+(x.total-t.total).toFixed(1):'',appAbs:x.absent,vAbs:t.cuentan,appMargen:x.margin,vMargen:t.margen,dMargen:t.margen!=null?+(x.margin-t.margen).toFixed(2):'',st:x.status,jAbs:x.j&&x.j.absent,jMargen:x.j&&x.j.margin,vJM:t.margenJ,quedan:rem[x.name]||0,vQuedan:t.quedanClase}});console.table(rows);return{S,sum}}
module.exports={C,SU,base,SET,faltas,run,mk,A,B,ALL,V};
if(require.main===module){
 run('1) Mejor config posible (historial A, B principal, proyecto con rangos, DIG 2h cada jueves), 33 sem',base(),SET);
 run('2) Igual pero semanas=21 (lo que dura mi curso)',base(),Object.assign({},SET,{semanas:21}));
 run('3) Igual pero semanas=20',base(),Object.assign({},SET,{semanas:20}));
 run('4) Sin historial (solo horario B todo el curso) 33 sem',base({history:[]}),SET);
 run('5) Sin rangos de proyecto (no se pueden meter semanas pasadas a mano)',base({project:{name:'PRJ',weeks:2,schedule:mk(ALL),ranges:[]}}),SET);
 run('6) ambito curso',base(),Object.assign({},SET,{ambito:'curso'}));
 run('7) calendario por defecto de la app (33 sem, 3 trimestres hasta mayo, sin tocar) ',base({terms:[{id:'1r',label:'1r',from:'2026-09-14',to:'2026-11-27'},{id:'2n',label:'2n',from:'2026-11-30',to:'2027-03-05'},{id:'3r',label:'3r',from:'2027-03-08',to:'2027-05-26'}]}),SET,'1r');
}
