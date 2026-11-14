// alta(L, variante): 'naive' = PROJ pintado como PROJ; 'fiel' = horas PROJ pintadas con el módulo del profesor
const GRID={naive:{'E.SER':[[1,0],[1,1],[3,2]],'E.CLI':[[2,0],[2,1],[4,1]],'DAW':[[3,0],[3,1]],'DIW':[[1,2],[4,0]],'IPO II':[[2,2],[5,0]],'OPT':[[5,1]],'PROJ':[[1,3],[2,3],[4,2]],'TUT':[[5,2]]},
fiel:{'E.SER':[[1,0],[1,1],[3,2],[1,3]],'E.CLI':[[2,0],[2,1],[4,1],[2,3]],'DAW':[[3,0],[3,1]],'DIW':[[1,2],[4,0],[4,2]],'IPO II':[[2,2],[5,0]],'OPT':[[5,1]],'TUT':[[5,2]]}};
exports.GRID=GRID;
exports.alta=async(X,variant='naive',o={})=>{const {p,tap,type,shot,c}=X;const S=o.shots?shot:async()=>{};
await type('#ct-q','pedr');await p.waitForTimeout(500);
await tap('[data-ct]');await tap('[data-cy="ICC0"]');await tap('[data-act=how-paint]');
const pal=async(name)=>{const bs=await p.$$('[data-pal]');for(const x of bs){if((await x.innerText()).trim().split('\n')[0].trim()===name){c.taps++;await x.click();await p.waitForTimeout(100);return;}}throw new Error('no pal '+name)};
// TUT no está en la paleta: + Otra asignatura
const g=GRID[variant];let first=true;
for(const name of Object.keys(g)){
  if(name==='TUT'){await tap('[data-act=q-add]');await type('#q-sub input[name=s]','TUT');c.taps++;await p.click('#q-sub button.primary');await p.waitForTimeout(150);if(await p.$('[data-act=q-add-done]')){await tap('[data-act=q-add-done]');}await S('b05-tut-anadida');}
  await pal(name);
  for(const [d,r] of g[name]) await tap(`.gc[data-d="${d}"][data-r="${r}"]`);
  if(first){first=false;await S('b04-tras-primer-modulo');}
}
if(o.brk){await tap('details.more:has([data-qf=start]) summary');c.taps+=2;await p.selectOption('[data-qf=brkMin]','30');await p.waitForTimeout(200);}
await S('b06-rejilla-llena');
if(o.stopAtGrid)return;
await tap('[data-act=q-next]');await S('b07-calendario');
await tap('[data-act=q-next]');await S('b08-reglas0');
await tap('[data-qset="retrasos|3"]');await S('b08-reglas');
await tap('[data-act=q-next]');await S('b09-previas');
};
