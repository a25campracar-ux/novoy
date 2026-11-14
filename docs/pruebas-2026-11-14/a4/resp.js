// Respuestas que daría "ChatGPT" para el alta. Genera r1 (perfecta), r3 (dos límites) y variantes de error (r2*).
const {H,NOMS,TERMS,FEST,F}=require('./datos.js');const fs=require('fs');
const N=k=>NOMS[k];
const hh=(a,b)=>(+b.slice(0,2)*60+ +b.slice(3)-(+a.slice(0,2)*60+ +a.slice(3)))/60;
const horario={};Object.keys(H).forEach(d=>horario[d]=H[d].map(b=>({inicio:b[0],fin:b[1],asignatura:N(b[2]),horas:hh(b[0],b[1])})));
const prev=[];Object.keys(NOMS).forEach(m=>{['A','J'].forEach(e=>{const h=F.filter(f=>f.mod===m&&f.estado===e).reduce((a,f)=>a+f.horas,0);if(h)prev.push({fecha:null,asignatura:N(m),horas:h,tipo:'falta',justificada:e==='J'});});});
const base=()=>({formato:'puedo-faltar/2',centro:'Escola Bell-lloc Girona FP · 1r CFGS Màrqueting i Publicitat',limite:25,
 trimestres:TERMS.map(t=>({id:t[0],nombre:t[1],desde:t[2],hasta:t[3]})),
 festivos:FEST.map(f=>({desde:f[0],hasta:f[1],nombre:f[2]})),horario:JSON.parse(JSON.stringify(horario)),
 tramos:[],unificar:[],no_cuentan:['Tutoria'],
 reglas:{ambito:'trimestre',justificadas:'no_cuentan',limite_justificadas:25,semanas_curso:33,retrasos_por_falta:0},
 faltas:JSON.parse(JSON.stringify(prev)),
 dudas:["El centre té un segon límit: justificades + no justificades no poden passar del 40 %. Aquest format no el pot expressar; només he posat el 25 % de no justificades."]});
const wrap=j=>'Perfecte, Júlia! Ja ho tinc tot: 1r de Màrqueting i Publicitat, 30 h setmanals, 3 trimestres i límit del 25 % (només no justificades).\nPorta 27 h no justificades i 14 h justificades aquest trimestre.\n\n```json\n'+JSON.stringify(j,null,2)+'\n```';
const W=(n,s)=>fs.writeFileSync(__dirname+'/resp/'+n+'.txt',s);
fs.mkdirSync(__dirname+'/resp',{recursive:true});
const r1=base();W('r1_perfecta',wrap(r1));
// r3: lo que haría una IA gratuita con los dos límites
const r3a=base();r3a.reglas={ambito:'trimestre',justificadas:'separadas',limite_justificadas:40,semanas_curso:33,retrasos_por_falta:0};r3a.dudas=[];W('r3a_separadas40',wrap(r3a));
const r3b=base();r3b.reglas={ambito:'trimestre',justificadas:'no_cuentan',limite_justificadas:25,limite_total:40,semanas_curso:33,retrasos_por_falta:0};r3b.limite_total=40;r3b.dudas=[];W('r3b_campo_inventado',wrap(r3b));
const r3c=base();r3c.reglas={ambito:'trimestre',justificadas:'separadas',limite_justificadas:15,semanas_curso:33,retrasos_por_falta:0};r3c.dudas=['He posat 15 % per a les justificades (40 − 25) perquè el format no admet un límit conjunt.'];W('r3c_separadas15',wrap(r3c));
const r3d=base();r3d.limite=40;r3d.reglas.justificadas='juntas';r3d.dudas=[];W('r3d_juntas40',wrap(r3d));
const r3e=base();r3e.limite='25% no justificades / 40% total';W('r3e_limite_texto',wrap(r3e));
const r3f=base();r3f.reglas.justificadas='no cuentan';W('r3f_no_cuentan_con_espacio',wrap(r3f));
// r2: errores típicos, uno a uno y todos juntos
const V={};
V.r2a_texto_y_comillas=()=>'Aquí tens el teu JSON 😊\n\n'+JSON.stringify(base(),null,2).replace(/"/g,(m,i)=>i%2?'“':'”')+'\n\nVols que t\'expliqui com enganxar-lo a l\'app?';
V.r2b_dias_tilde_mayus=()=>{const j=base();j.horario={'Lunes':j.horario.lunes,'Martes':j.horario.martes,'Miércoles':j.horario.miercoles,'Jueves':j.horario.jueves,'Viernes':j.horario.viernes,'Sábado':[]};return wrap(j)};
V.r2c_dias_catalan=()=>{const j=base();j.horario={dilluns:j.horario.lunes,dimarts:j.horario.martes,dimecres:j.horario.miercoles,dijous:j.horario.jueves,divendres:j.horario.viernes};return wrap(j)};
V.r2d_horas_8_00=()=>wrap(base()).replace(/"08:00"/g,'"8:00"');
V.r2e_horas_8h=()=>wrap(base()).replace(/"08:00"/g,'"8h"').replace(/"10:00"/g,'"10h"');
V.r2f_horas_8_00_am=()=>wrap(base()).replace(/"08:00"/g,'"8:00 AM"').replace(/"13:30"/g,'"1:30 PM"').replace(/"14:30"/g,'"2:30 PM"');
V.r2g_sin_horas_campo=()=>{const j=base();Object.values(j.horario).forEach(d=>d.forEach(b=>delete b.horas));return wrap(j)};
V.r2h_horas_string=()=>{const j=base();Object.values(j.horario).forEach(d=>d.forEach(b=>b.horas=b.horas+' h'));return wrap(j)};
V.r2i_nombres_inconsistentes=()=>{const j=base();j.horario.lunes[0].asignatura='Marqueting Digital';j.horario.miercoles[1].asignatura='Màrqueting digital (MD)';j.horario.viernes[0].asignatura='MÀRQUETING DIGITAL';j.no_cuentan=['Tutoría'];j.faltas.forEach(f=>{if(f.asignatura==='Anglès')f.asignatura='Inglés'});return wrap(j)};
V.r2j_comentarios=()=>wrap(base()).replace('"limite": 25,','"limite": 25, // 25 % de faltes no justificades').replace('"tramos": [],','"tramos": [], /* no canvia l\'horari */');
V.r2k_truncado=()=>{const s=wrap(base());return s.slice(0,Math.floor(s.length*0.6))};
V.r2l_coma_final=()=>wrap(base()).replace(/\n  "dudas": \[([\s\S]*?)\]\n\}/,'\n  "dudas": [$1],\n}');
V.r2m_copia_ejemplo=()=>{const j=base();j.trimestres[0].horas_totales=[{asignatura:'Matematicas',horas:99}];j.festivos.unshift({desde:'2026-10-12',hasta:'2026-10-12',nombre:'Fiesta Nacional'});j.tramos=[{nombre:'A partir de febrero',desde:'2027-02-08',hasta:'2027-06-19',horario:{lunes:[],martes:[],miercoles:[],jueves:[],viernes:[]}}];j.unificar=[{asignatura:'Proyecto (Pol)',dentro_de:'Programacion'}];j.faltas=[{fecha:null,asignatura:'Matematicas',horas:2,tipo:'falta',justificada:false}];j.dudas=['Lo que no se vea claro en las fotos'];return wrap(j)};
V.r2n_fechas_ddmm=()=>wrap(base()).replace(/"(\d{4})-(\d\d)-(\d\d)"/g,'"$3/$2/$1"');
V.r2o_sin_recreo_bloque_largo=()=>{const j=base();j.horario.lunes=[{inicio:'08:00',fin:'10:00',asignatura:N('MD'),horas:2},{inicio:'10:00',fin:'12:30',asignatura:N('GEF'),horas:2},{inicio:'12:30',fin:'14:30',asignatura:N('ANG'),horas:2}];return wrap(j)};
V.r2p_recreo_como_asignatura=()=>{const j=base();Object.values(j.horario).forEach(d=>{d.push({inicio:'11:00',fin:'11:30',asignatura:'Pati',horas:0.5});});return wrap(j)};
V.r2q_un_solo_trimestre_curso=()=>{const j=base();j.trimestres=[{id:'curs',nombre:'Curs 2026-27',desde:'2026-09-14',hasta:'2027-06-11'}];return wrap(j)};
V.r2r_sin_festivos=()=>{const j=base();delete j.festivos;return wrap(j)};
V.r2s_dos_bloques_json=()=>'Resum:\n```json\n{"resum":"30 h setmanals"}\n```\nI aquí el JSON complet:\n'+wrap(base()).split('\n\n').pop();
V.r2t_sin_bloque_solo_texto=()=>'Ho sento, he arribat al límit de missatges del pla gratuït. Torna-ho a provar més tard.';
V.r2u_horas_55min=()=>{const j=base();j.horario.lunes=[{inicio:'08:00',fin:'09:50',asignatura:N('MD'),horas:2},{inicio:'09:50',fin:'10:45',asignatura:N('GEF'),horas:1},{inicio:'11:15',fin:'12:10',asignatura:N('GEF'),horas:1},{inicio:'12:10',fin:'14:00',asignatura:N('ANG'),horas:2}];return wrap(j)};
V.r2v_faltas_null_string=()=>wrap(base()).replace(/"fecha": null/g,'"fecha": "null"');
V.r2w_faltas_con_total=()=>{const j=base();j.faltas=[{fecha:null,asignatura:'Total',horas:41,tipo:'falta',justificada:false}];return wrap(j)};
V.r2x_limite_025=()=>{const j=base();j.limite=0.25;return wrap(j)};
V.r2y_limite_string=()=>{const j=base();j.limite='25%';return wrap(j)};
V.r2z_todo_junto=()=>{const j=base();j.horario={'Lunes':j.horario.lunes,'Martes':j.horario.martes,'Miércoles':j.horario.miercoles,'Jueves':j.horario.jueves,'Viernes':j.horario.viernes};j.horario.Lunes[0].asignatura='Marqueting Digital';j.extra_notas='Recorda revisar el Moodle';delete j.tramos;return ('Aquí tens! 🎉\n\n```json\n'+JSON.stringify(j,null,2)+'\n```\n\nSi vols, et faig també un Excel.').replace(/"08:00"/g,'"8:00"').replace(/"/g,(m,i)=>i%7===0?'“':'"')};
Object.keys(V).forEach(k=>W(k,V[k]()));
// probar todo con parseImport
const SU=require('/home/claude/novoy/site/setup.js');
fs.readdirSync(__dirname+'/resp').sort().forEach(f=>{const r=SU.parseImport(fs.readFileSync(__dirname+'/resp/'+f,'utf8'));
 console.log('\n## '+f+' → '+(r.ok?'ACEPTA':'RECHAZA'));
 r.errors.slice(0,4).forEach(e=>console.log('  E: '+e));if(r.errors.length>4)console.log('  … +'+(r.errors.length-4)+' errores');
 r.warnings.slice(0,5).forEach(e=>console.log('  W: '+e));if(r.warnings.length>5)console.log('  … +'+(r.warnings.length-5)+' avisos');
 if(r.ok){const c=r.config;const subs=new Set();Object.values(c.schedule).forEach(d=>d.forEach(b=>subs.add(b.subject)));
  console.log('  dias:',Object.keys(c.schedule).join(','),'| asignaturas:',subs.size,'| h/sem:',Object.values(c.schedule).flat().reduce((a,b)=>a+b.hours,0),'| trim:',c.terms.length,'| fest:',c.holidays.length,'| limite:',r.limite,'| reglas:',JSON.stringify(r.reglas),'| nocount:',JSON.stringify(c.nocount),'| faltas:',r.faltas.length,'h',r.faltas.reduce((a,f)=>a+f.hours,0),'| totals:',JSON.stringify(c.totals),'| periods:',c.periods.length,'alias',JSON.stringify(c.alias));}
});
