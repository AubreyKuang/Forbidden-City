/* A family background can name a real office; singular offices have one incumbent. */
const GOVERNOR_SEATS=['两江总督','直隶总督','湖广总督','闽浙总督','两广总督','川陕总督','云贵总督'];
const MINISTER_SEATS=['吏部尚书','户部尚书','礼部尚书','兵部尚书','刑部尚书','工部尚书'];
const SINGLE_FAMILY_OFFICES=new Set([...GOVERNOR_SEATS,...MINISTER_SEATS,'内阁首辅']);
const familyOriginsActive=()=>!!S&&journalContentVersion()>=32;
for(const title of [...GOVERNOR_SEATS,...MINISTER_SEATS]){OFFICE_GRADES[title]=2;OFFICE_BLOC[title]??=GOVERNOR_SEATS.includes(title)?'army':'civil';}
const familyOfficeOccupied=p=>p&&p.alive!==false&&!p.retired&&!p.dismissed&&!p.exiled&&!['student','commoner'].includes(p.career);
function familyOriginPeople(){return [...new Set([...(S?.consorts||[]),...(S?.cands||[]),...(S?.retainedFamilies||[]),...(S?.shelteredGuests||[])])];}
function familyOfficeHolders(){
 const people=[],seen=new Set();
 for(const c of familyOriginPeople()){
  const h=c.house;if(!h)continue;
  for(const role of ['father',...brotherRoles(h)]){const p=h[role];if(!p||seen.has(p.id||p))continue;seen.add(p.id||p);people.push({p,c,h,role});}
  for(const p of h.relatives||[])if(p.sex==='m'&&!seen.has(p.id)){seen.add(p.id);people.push({p,c,h,role:'relative'+p.id});}
 }
 for(const p of S?.scholars||[])if(!seen.has(p.id)){seen.add(p.id);people.push({p});}
 return people;
}
function familyOfficeTaken(title,except=null,{candidates=false}={}){
 if(!SINGLE_FAMILY_OFFICES.has(title))return false;
 if(familyOfficeHolders().some(({p})=>p!==except&&p.id!==except?.id&&familyOfficeOccupied(p)&&(p.office||p.post)===title))return true;
 return candidates&&familyOriginPeople().some(c=>!c.house&&c.fam?.t===title);
}
function availableFamilyOffice(title,except=null,reserveCandidates=false){
 if(!familyOfficeTaken(title,except,{candidates:reserveCandidates}))return title;
 const alternatives=GOVERNOR_SEATS.includes(title)?GOVERNOR_SEATS:MINISTER_SEATS.includes(title)?MINISTER_SEATS:[];
 return alternatives.find(t=>!familyOfficeTaken(t,except,{candidates:reserveCandidates}))||(title==='内阁首辅'?'内阁大学士':'协办大学士');
}
const originsMakeGirl=makeGirl;
makeGirl=function(o={}){
 const c=originsMakeGirl(o);
 if(familyOriginsActive()&&!o.fam){const title=availableFamilyOffice(c.fam.t,null,true);if(title!==c.fam.t)c.fam={...c.fam,t:title};}
 return c;
};
function setFamilyOffice(entry,title,{record=false}={}){
 const {p,h,role}=entry,old=p.office||p.post;if(old===title)return;
 p.office=title;p.post=title;p.away=/总督/.test(title);p.career='official';
 if(role==='father')for(const c of familyOriginPeople().filter(c=>c.house?.father?.id===p.id)){
  c.house=h;if(c.fam.t===old)c.fam={...c.fam,t:title};
  if(record&&S.consorts.includes(c)&&c.alive)story(c,`【外家任职】家书载明：父亲${p.name}现任${title}。`);
 }
 if(record)story(p,`【任职名册】现任${title}，在任官名已与家族名册核合。`);
}
const originsHouseOf=houseOf;
houseOf=function(c){
 const existed=!!c?.house,h=originsHouseOf(c);
 if(familyOriginsActive()&&h&&!existed&&familyOfficeOccupied(h.father))setFamilyOffice({p:h.father,c,h,role:'father'},availableFamilyOffice(h.father.office,h.father));
 return h;
};
const originsGenCands=genCands;
genCands=function(...args){const r=originsGenCands.apply(this,args);if(familyOriginsActive())for(const c of S.cands)houseOf(c);return r;};
function reconcileFamilyOffices(){
 if(!familyOriginsActive())return;
 const all=familyOfficeHolders().filter(({p})=>familyOfficeOccupied(p)),used=new Set();
 // Prefer a documented recent appointment, then the already established family.
 all.sort((a,b)=>(b.p.lastCareerChange??-99)-(a.p.lastCareerChange??-99)||String(a.p.id).localeCompare(String(b.p.id)));
 for(const entry of all){const title=entry.p.office||entry.p.post;if(!SINGLE_FAMILY_OFFICES.has(title))continue;
  if(!used.has(title)){used.add(title);continue;}
  const next=availableFamilyOffice(title,entry.p);setFamilyOffice(entry,next,{record:true});used.add(next);
 }
}
const originsCareerSetOffice=careerSetOffice;
careerSetOffice=function(person,title,reason){return originsCareerSetOffice(person,familyOriginsActive()?availableFamilyOffice(title,person.p):title,reason);};
const originsMigrate=migrate;
migrate=function(...args){const r=originsMigrate.apply(this,args);reconcileFamilyOffices();return r;};
