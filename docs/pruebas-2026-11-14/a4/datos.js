// Datos del caso (independiente de la app)
const H = { // horario: dia -> [inicio, fin, modulo]
  lunes:    [['08:00','10:00','MD'],['10:00','11:00','GEF'],['11:30','12:30','GEF'],['12:30','14:30','ANG']],
  martes:   [['08:00','10:00','PM'],['10:00','11:00','IC'],['11:30','12:30','IC'],['12:30','14:30','FOL']],
  miercoles:[['08:00','10:00','GEF'],['10:00','11:00','MD'],['11:30','13:30','ACU'],['13:30','14:30','TUT']],
  jueves:   [['08:00','10:00','ANG'],['10:00','11:00','PM'],['11:30','12:30','PM'],['12:30','14:30','IC']],
  viernes:  [['08:00','10:00','MD'],['10:00','11:00','PM'],['11:30','12:30','GEF'],['12:30','13:30','FOL'],['13:30','14:30','ACU']],
};
const NOMS = { MD:'Màrqueting digital', GEF:"Gestió econòmica i financera de l'empresa", PM:'Polítiques de màrqueting', IC:'Investigació comercial', ACU:"Atenció al client, consumidor i usuari", FOL:'Formació i orientació laboral', ANG:'Anglès', TUT:'Tutoria' };
const TERMS = [['1r','1r trimestre','2026-09-14','2026-12-04'],['2n','2n trimestre','2026-12-09','2027-03-12'],['3r','3r trimestre','2027-03-15','2027-06-11']];
const FEST = [['2026-10-12','2026-10-12','Festa Nacional'],['2026-10-29','2026-10-29','Sant Narcís (festa local Girona)'],['2026-11-02','2026-11-02','Lliure disposició'],['2026-12-07','2026-12-08','Pont de la Puríssima'],['2026-12-23','2027-01-07','Vacances de Nadal'],['2027-02-15','2027-02-15','Lliure disposició'],['2027-03-22','2027-03-29','Setmana Santa'],['2027-05-17','2027-05-17','Lliure disposició']];
// faltas: fecha, inicio, modulo, estado (A no justificada, J justificada, R retard)
const F = [];
const day=(d,st,only)=>{const wd=['domingo','lunes','martes','miercoles','jueves','viernes'][new Date(d+'T12:00').getDay()];H[wd].forEach(b=>{if(!only||only.includes(b[0]))F.push({fecha:d,inicio:b[0],fin:b[1],mod:b[2],estado:st,horas:(+b[1].slice(0,2)*60+ +b[1].slice(3)-(+b[0].slice(0,2)*60+ +b[0].slice(3)))/60});});};
day('2026-09-21','A',['08:00','10:00','11:30','12:30']);         // lunes entero
day('2026-09-28','R',['08:00']);                                  // retard MD
day('2026-10-01','J');                                            // grip (jueves)
day('2026-10-02','J');                                            // grip (viernes)
day('2026-10-13','A');                                            // pont (martes)
day('2026-10-15','R',['08:00']);                                  // retard ANG
day('2026-10-19','A',['08:00']);                                  // MD dormida
day('2026-10-28','A',['11:30','13:30']);                          // ACU + TUT
day('2026-10-30','A');                                            // pont Sant Narcís (viernes)
day('2026-11-04','A',['08:00']);                                  // GEF
day('2026-11-05','J',['12:30']);                                  // IC metge
day('2026-11-09','A',['08:00']);                                  // MD
day('2026-11-11','R',['08:00']);                                  // retard GEF
module.exports={H,NOMS,TERMS,FEST,F};
