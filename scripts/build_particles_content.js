const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const intake = JSON.parse(fs.readFileSync(path.join(root, 'docs/analysis/lesson03/intake.json'), 'utf8'));
const rows = new Map(intake.records.map(row => [row.id, row]));
// Frozen intake tables have a fixed, audited column layout, without nested pipes.
const cells = id => rows.get(id).record.split('|').slice(1, -1).map(cell => cell.trim());
const ids = prefix => [...rows.keys()].filter(id => id.startsWith(prefix)).sort();
const clean = text => text.replace(/\*\*/g, '').replace(/’/g, "'");
const meta = (id, material, unit) => ({ slug:id.toLowerCase(), intakeId:id, lessonSource:{material, unit, analysis:'docs/analysis/lesson03/source-analysis.md'} });
const pair = (id, mt, en, material, unit) => ({...meta(id, material, unit), maltese:clean(mt), english:en});
const group = (id, title, itemType, items) => ({id, title, itemType, items});
const bank = (page, groups) => ({schemaVersion:2, source:{kind:'site',page}, page, groups});
const q = (id, prompt, answer, english, topic, explanation, options, accepted, material, unit) => ({
  ...meta(id, material, unit), itemType:'questionAnswer', question:{maltese:clean(prompt),english},
  answer:{maltese:clean(answer),...(['translation','corrections'].includes(topic)?{english}: {})}, topic, explanation,
  ...(options ? {options:options.map(clean)} : {}), ...(accepted ? {accepted:accepted.map(clean)} : {})
});
const groups=[];
groups.push(group('particle-meanings','Particles and Article Forms','translation',ids('L03-ref-').map(id => {
  const c=cells(id);return {...pair(id,c[4],c[5],'M09',1),particle:clean(c[1]),meaning:c[2],contracted:c[3]};
})));
const rules=[
  ['article','Choose the article','Use the article form with an article-bearing noun phrase; names, possessives and demonstratives require their own context. The ta\'/tal- substitution is a useful diagnostic, not a rule based only on English the.'],
  ['sun','Sun consonants','Before ċ, d, n, r, s, t, x, z and ż, the article l assimilates to the initial consonant. Compare fil-ħanut with fit-triq.'],
  ['vowels','Vowel-initial words','Forms differ by particle: ġol-ilma, mal-art, tal-ewwel and sal-artal retain l. Compare fl-art and bl-oġġett; do not use one universal vowel rule.'],
  ['short','Shortened lil','Choose article or no article first: lil becomes \'l or \'il; lill- becomes \'l- or \'il-. Retain i when the contraction lies between two consonant sounds. Keep a hyphen only with the article form.'],
  ['direction','Directions','Learn direction phrases in context: ħares \'il fuq, mur \'l hemm. The h in hemm or hawn is not an ordinary pronounced consonant.'],
  ['with','Two meanings of with','Ma\' expresses accompaniment; bi can express an instrument or manner. They are not interchangeable in every phrase.']
];
groups.push(group('particle-rules','Core Rules','rule',rules.map(([id,title,rule])=>({slug:'l03-rule-'+id,title,rule}))));
const sun=[];
for (const id of ids('L03-sun-')) {
  if(id==='L03-sun-02')continue;
  const c=cells(id),unit=Number(id.slice(-2))+2;
  sun.push({...pair(id,c[2],c[3],'M01',unit),incorrect:clean(c[1]),explanation:'The article assimilates to the first sun consonant of the noun.'});
}
groups.push(group('particle-sun','Sun Consonants','example',sun));
groups.push(group('particle-extra','More Article Combinations','translation',ids('L03-extra-').map(id=>{const c=cells(id);return pair(id,c[1],c[2],Number(id.slice(-2))<=7?'M09':'M11',1);})));
const article=ids('L03-article-').map(id=>{const c=cells(id);return pair(id,c[1],c[3],'M02',c[0].split(';')[1].trim());});
groups.push(group('particle-article','Article or No Article','example',article));
const practice=[];
sun.forEach(item=>practice.push(q(item.intakeId+'-rewrite',item.incorrect,item.maltese,item.english,'corrections',item.explanation,null,null,'M01',item.lessonSource.unit)));
const choices=[
  ['L03-article-05','Mark weġġa\' ___ ħabib tiegħu.','bħall-',['bħall-','bħal']],
  ['L03-article-06','Mark weġġa\' ___ sieħbu.','bħal',['bħal','bħall-']],
  ['L03-article-07','Rajt ___ ħabiba wara l-kantuniera. (the female friend)','lill-',['lill-','lil']],
  ['L03-article-08','Xtrajt rigal ___ oħti.','lil',['lill-','lil']],
  ['L03-article-09','Aħbar ___ dik qatt ma stennejtha.','bħal',['bħall-','bħal']],
  ['L03-article-10','Tkellimx ___ min ma tafx!','lil',['lil','lill-']],
  ['L03-article-11','Ħabiba ta\' veru ___ Hannah għad irrid nara.','bħal',['bħall-','bħal']],
  ['L03-article-12','___ ommi nagħmel kollox.','Għal',['Għal','Għall-']]
];
choices.forEach(([id,prompt,answer,options])=>practice.push(q(id+'-choose',prompt,answer,cells(id)[3],'articles','Check whether the following phrase takes an article. Names and attached possessives in these examples do not.',options,null,'M02',Number(id.slice(-2))+8)));
const shortAnswers={a:['\'l','\'il','\'il','\'il-','\'l-','\'il','\'il','\'il-','\'il'],b:['\'l','\'il','\'l-','\'il-','\'l','\'il','\'l']};
for(const series of ['a','b'])for(const id of ids('L03-lil-'+series)){
  if(id==='L03-lil-a07')continue;
  const c=cells(id),index=Number(id.slice(-2))-1,answer=shortAnswers[series][index];
  practice.push(q(id,c[1],answer,c[3],'shortened','First decide lil or lill- (article). Then check the sounds on both sides: keep i between two consonants; retain a hyphen only with the article.',["'l","'il","'l-","'il-"],null,series==='a'?'M06':'M07',index+(series==='a'?4:2)));
}
const translations=ids('L03-tr-').map(id=>{
  const c=cells(id),variants=clean(c[2]).split(' / ');
  return q(id,c[1]+(id==='L03-tr-01'?' (carrying it)':''),variants[0],c[1],'translation',id==='L03-tr-01'?'Here with means carrying/using the bag, so use bi + the article.':c[3].replace(/^DRAFT;?\s*/,''),null,variants,'M03',1);
});
practice.push(...translations);
const clozeFragments=[
  'Malli qomt dalgħodu fettili mmur dawra ___ mutur. (bi)',
  'Poġġejtu ___ garaxx ta\' missieri. (fi)',
  'Tfajtlu l-petrol ___ tank. (ġo)',
  'Malli pruvajt inqabbdu qabad ___ ewwel. (minn)',
  'Iddeċidejt li nitlaq ___ Xewkija. (minn)',
  'Nitlaq mix-Xewkija ___ Għajnsielem. (għal)',
  'Waqt li kont għaddej ___ triq, qasamli żiemel. (minn)',
  'Ħbatt ___ ħajt tas-sejjieħ. (ma\')',
  'Il-ħajt hemm ___ ġenb tat-triq. (fi)',
  'Waqajt għal tuli ___ art u stordejt. (fi)',
  'Malli rani ___ dak l-istat. (fi)',
  '', '',
  'Żammewni jumejn ___ osservazzjoni. (għal)',
  'Nispera li ma jerġax jiġrili ___ din id-darba. (bħal)'
];
for(const id of ids('L03-gap-')){
  const index=Number(id.slice(-2))-1;if(!clozeFragments[index])continue;
  const c=cells(id);
  practice.push(q(id,clozeFragments[index],c[2],'Complete the particle in the sentence.','cloze',c[4].replace('DRAFT; RULE; ','').replace('DRAFT; RULE','Check the article and the first sound of the following word.'),null,null,'M10',1));
}
groups.push(group('particle-practice','Particle Practice','questionAnswer',practice));
const motorcycle=[
  ['Malli qomt dalgħodu fettili mmur dawra bil-mutur.','When I woke up this morning, I felt like going for a motorcycle ride.'],
  ['Kien ilni snin ma nsuqu.','I had not ridden it for years.'],
  ["Kont xtrajtu meta kelli 18-il sena, għamilt sena nsuqu, u xħin xtrajt il-karozza, ma soqtux aktar.",'I bought it when I was eighteen, rode it for a year, and stopped riding it when I bought a car.'],
  ["Poġġejtu fil-garaxx ta' missieri u minn dakinhar insejtu.","I put it in my father's garage and forgot about it from then on."],
  ['Però dalgħodu tfajtlu l-petrol ġot-tank u malli pruvajt inqabbdu qabad mill-ewwel.','But this morning I put petrol in the tank, and when I tried to start it, it started immediately.'],
  ['Iddeċidejt li nitlaq mix-Xewkija, fejn joqgħod missieri, għal Għajnsielem.','I decided to set off from Xewkija, where my father lives, for Għajnsielem.'],
  ["Waqt li kont għaddej mit-triq, qasamli żiemel, evitajtu iżda ħbatt mal-ħajt tas-sejjieħ li hemm fil-ġenb tat-triq.",'While I was going along the road, a horse crossed in front of me. I avoided it, but hit the rubble wall at the side of the road.'],
  ['Waqajt għal tuli fl-art u stordejt.','I fell flat on the ground and felt dazed.'],
  ['Waqaf wieħed jgħinni.','Someone stopped to help me.'],
  ['Ħaduni l-isptar u żammewni jumejn għal osservazzjoni.','They took me to hospital and kept me there for two days for observation.'],
  ["Nispera li d-darba li ġejja li mmur dawra ma jerġax jiġrili bħal din id-darba.",'I hope the same thing does not happen the next time I go for a ride.']
];
groups.push(group('particle-motorcycle-story','Dawra bil-mutur','example',motorcycle.map(([mt,en],i)=>({...pair('L03-moto-'+String(i+1).padStart(2,'0'),mt,en,'M10',1),adaptedFromSource:true}))));
const story=ids('L03-read-').map(id=>{
  const text=rows.get(id).record.trim().split(/\n\s*\n/);
  return pair(id,text[0],text[1],'M04',1);
});
const comprehension=ids('L03-qa-').map(id=>{
  const c=cells(id);return {...meta(id,'M04',1),question:{maltese:clean(c[1]),english:c[2]},answer:{maltese:clean(c[3]),english:c[2]},selfAssessed:true};
});
// These are answer translations, not a repeated question masquerading as one.
const qaEnglish=['In July.','There were remote hills.','Leli and Ġanni. Ġanni is Leli\'s nephew (or grandson; the source word is ambiguous).','Because they were curious and wanted to explore the passage.','Because the rocks at the entrance glowed like fire in the evening sun.','They heard water dripping from the ceiling.','They found a small rusty iron box with an old crucifix engraved on it.','They decided to take it home and try to open it with the family.'];
comprehension.forEach((item,i)=>item.answer.english=qaEnglish[i]);
const direction=ids('L03-dir-').map(id=>{const c=cells(id);return pair(id,c[1],c[2],'M05',1);});
const outputs={
  'assets/data/particles_prepositions_examples.json':bank('particles_prepositions.html',groups),
  'assets/data/reading_red_cave_examples.json':bank('reading_red_cave.html',[group('red-cave-story','The Red Cave','example',story),{...group('red-cave-comprehension','Comprehension','questionAnswer',comprehension),presentation:'disclosure'}]),
  'assets/data/directions_particles_examples.json':bank('directions_town.html',[group('direction-particles','Direction Expressions','translation',direction)])
};
const held=new Set(['L03-sun-02','L03-lil-a07','L03-gap-12','L03-gap-13']);
const allItems=Object.values(outputs).flatMap(b=>b.groups.flatMap(g=>g.items));
const coverage={schemaVersion:1,sourceFiles:25,intakeRecords:109,heldForReview:[...held],records:[...rows.keys()].map(id=>({id,state:held.has(id)?'held-for-review':'included',outputIds:allItems.filter(item=>item.intakeId===id||item.intakeId?.startsWith(id+'-')).map(item=>item.slug)}))};
outputs['docs/analysis/lesson03/site-coverage.json']=coverage;
let stale=false;
for(const [file,data] of Object.entries(outputs)){
  const text=JSON.stringify(data,null,2)+'\n',dest=path.join(root,file);
  if(process.argv.includes('--check')){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==text){console.error('Stale: '+file);stale=true;}}
  else fs.writeFileSync(dest,text);
}
if(stale)process.exitCode=1;
else console.log(`${process.argv.includes('--check')?'Checked':'Built'} particle, reading and direction banks: ${practice.length} exercises, ${story.length} reading sentences, ${direction.length} direction phrases; ${held.size} held intake records.`);
