// Datos del caso (independiente de la app)
const P=[['15:00','15:55'],['15:55','16:50'],['16:50','17:45'],['18:05','19:00'],['19:00','19:55'],['19:55','20:50']]; // recreo 17:45-18:05
const H={ // dia(1=lunes) -> modulo por franja P1..P6
 1:['Cures','Cures','Cures','Ésser humà','Ésser humà','FOL'],
 2:['Higiene','Higiene','Benestar','Primers auxilis','Primers auxilis','Tutoria'],
 3:['Ésser humà','Ésser humà','Cures','Cures','Cures','Suport'],
 4:['Odonto','Odonto','OADS','Higiene','Relacions','Relacions'],
 5:['Benestar','Benestar','Ésser humà','FOL','Suport','OADS']};
const FEST=[['2026-09-29','2026-09-29','Sant Miquel (Lleida)'],['2026-10-12','2026-10-12','Fiesta Nacional'],['2026-11-02','2026-11-02','Lliure disposició'],['2026-12-07','2026-12-07','Lliure disposició'],['2026-12-08','2026-12-08','Inmaculada'],['2026-12-22','2027-01-07','Navidad'],['2027-02-15','2027-02-15','Lliure disposició (Carnaval)'],['2027-03-20','2027-03-29','Semana Santa'],['2027-05-11','2027-05-11','Sant Anastasi (Lleida)']];
const TERMS=[['1r','2026-09-14','2026-12-04'],['2n','2026-12-09','2027-03-12'],['3r','2027-03-15','2027-06-18']];
// faltas: [fecha, [franjas 1..6], justificada]
const F=[
 ['2026-09-22',[1,2,3,4,5,6],false],['2026-09-24',[1,2],false],
 ['2026-09-30',[6],false],['2026-10-02',[5],false],
 ['2026-10-05',[1,2,3,4,5,6],true],['2026-10-06',[1,2,3,4,5,6],true],
 ['2026-10-09',[5],false],['2026-10-14',[6],false],['2026-10-16',[5,6],false],
 ['2026-10-19',[1,2,3],false],['2026-10-21',[1,2,3,4,5,6],false],['2026-10-23',[5],false],
 ['2026-10-27',[4,5],true],['2026-10-28',[6],false],['2026-10-30',[1,2,3,4,5,6],false],
 ['2026-11-04',[3,4,5],false],['2026-11-06',[4,5,6],false],['2026-11-09',[1,2,3],true],
 ['2026-11-11',[6],false],['2026-11-12',[1,2],false]];
// retrasos: [fecha, franja, justificado]
const R=[['2026-09-21',1,false],['2026-09-28',1,false],['2026-10-26',1,false],['2026-09-23',1,false],['2026-10-07',1,false],
 ['2026-10-15',1,false],['2026-10-22',1,false],['2026-11-05',1,false],['2026-11-10',1,true],['2026-11-13',1,false]];
module.exports={P,H,FEST,TERMS,F,R};
