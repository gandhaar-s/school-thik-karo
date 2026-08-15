let states=[],stateData=null,stateCode='',districtIndex=-1;const $=s=>document.querySelector(s),esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])),norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const F={u:0,n:1,d:2,sd:3,cl:4,v:5,p:6,cat:7,type:8,m:9,est:10,loc:11,from:12,to:13,rooms:14,other:15,teachers:16,students:17,pre:18,lon:19,lat:20};
const fmt=v=>v==null?'—':Number(v).toLocaleString('en-IN'), ratio=(a,b)=>a&&b?(a/b).toFixed(1)+':1':'—', dict=(k,i)=>i==null||i<0?'—':(stateData?.[k]?.[i]??'—');
async function init(){const [ss,meta]=await Promise.all([fetch('data/states.json').then(r=>r.json()),fetch('data/meta.json').then(r=>r.json())]);states=ss;$('#state').innerHTML='<option value="">Choose state / UT</option>'+ss.map(x=>`<option value="${x.code}">${esc(x.name)} · ${x.count.toLocaleString('en-IN')}</option>`).join('');$('#hint').textContent=`${meta.schools.toLocaleString('en-IN')} operational schools · dataset retrieved 12 Jan 2022 · direct UDISE lookup supported`;}
async function loadState(code){if(stateCode===code&&stateData)return stateData;stateCode=code;stateData=null;$('#count').textContent='Loading state data…';stateData=await (code==='09'
? Promise.all(['09-1','09-2','09-3'].map(p=>fetch(`data/s/${p}.json`).then(r=>{if(!r.ok)throw new Error('state data');return r.json()}))).then(parts=>{
    const first=parts[0], merged={...first,r:parts.flatMap(x=>x.r||[])};
    return merged;
  })
: fetch(`data/s/${code}.json`).then(r=>{if(!r.ok)throw new Error('state data');return r.json()}));return stateData}
$('#state').onchange=async e=>{const st=states.find(x=>x.code===e.target.value),d=$('#district');districtIndex=-1;render([]);if(!st){d.disabled=true;d.innerHTML='<option value="">Choose district</option>';stateData=null;stateCode='';return}d.disabled=false;d.innerHTML='<option value="">Choose district</option>'+st.districts.map((x,i)=>`<option value="${i}">${esc(x.name)} · ${x.count.toLocaleString('en-IN')}</option>`).join('');await loadState(st.code);$('#count').textContent='Choose a district or search within this state.'};
$('#district').onchange=e=>{districtIndex=e.target.value===''?-1:Number(e.target.value);search()};
$('#q').oninput=debounce(async()=>{const q=$('#q').value.trim();if(/^\d{11}$/.test(q))await direct(q);else search()},100);$('#clear').onclick=()=>{$('#q').value='';search()};$('#close').onclick=()=>$('#dlg').close();function debounce(f,m){let t;return()=>{clearTimeout(t);t=setTimeout(f,m)}}
async function direct(u){const sc=u.slice(0,2),st=states.find(x=>x.code===sc);if(!st){render([]);return}$('#state').value=sc;const d=$('#district');d.disabled=false;d.innerHTML='<option value="">Choose district</option>'+st.districts.map((x,i)=>`<option value="${i}">${esc(x.name)} · ${x.count.toLocaleString('en-IN')}</option>`).join('');await loadState(sc);const hit=stateData.r.find(r=>r[F.u]===u);if(hit){districtIndex=hit[F.d];d.value=String(districtIndex);render([hit]);openSchool(hit)}else render([])}
function search(){if(!stateData){if($('#q').value.trim())$('#count').textContent='Choose a state, or enter an 11-digit UDISE code.';return}const q=norm($('#q').value),tokens=q.split(' ').filter(Boolean);let rows=stateData.r;if(districtIndex>=0)rows=rows.filter(r=>r[F.d]===districtIndex);if(q.length>=2)rows=rows.filter(r=>{const hay=norm([r[F.n],dict('sd',r[F.sd]),dict('v',r[F.v]),dict('p',r[F.p]),r[F.u]].join(' '));return tokens.every(t=>hay.includes(t))});render(rows.slice(0,120),rows.length)}
function render(rows,total=rows.length){const st=states.find(x=>x.code===stateCode);$('#grid').innerHTML=rows.map((r,i)=>`<article class="card" data-i="${i}"><div class="code">UDISE ${esc(r[F.u])}</div><h2>${esc(r[F.n])}</h2><div class="place">${esc(dict('d',r[F.d]))}${dict('sd',r[F.sd])!=='—'?` · ${esc(dict('sd',r[F.sd]))}`:''}<br>${esc(dict('v',r[F.v])!=='—'?dict('v',r[F.v]):dict('p',r[F.p]))}</div><div class="tags"><span class="tag">${esc(dict('m',r[F.m]))}</span><span class="tag">${esc(dict('cat',r[F.cat]))}</span></div></article>`).join('');$('#count').textContent=total?`${Math.min(total,120).toLocaleString('en-IN')} shown${total>120?` of ${total.toLocaleString('en-IN')}`:''}`:'';$('#empty').classList.toggle('hidden',rows.length>0||!$('#q').value.trim());document.querySelectorAll('.card').forEach((el,i)=>el.onclick=()=>openSchool(rows[i]))}
const amenCache={};
const AF=["building_status","boundary_wall","total_class_rooms","classrooms_in_good_condition","classrooms_needs_minor_repair","classrooms_needs_major_repair","total_boys_toilet","total_boys_func_toilet","total_girls_toilet","total_girls_func_toilet","total_boys_cwsn_toilet","func_boys_cwsn_friendly","total_girls_cwsn_toilet","func_girls_cwsn_friendly","handwash_near_toilet","hand_pump_yn","well_prot_yn","tap_yn","othsrc_yn","pack_water_yn","hand_pump_fun_yn","well_prot_fun_yn","tap_fun_yn","othsrc_fun_yn","pack_water_fun_yn","rain_water_harvesting","handwash_facility_for_meal","electricity_availability","solar_panel","library_availability","book_bank","reading_corner","playground_available","playground_alt_yn","medical_checkups","availability_ramps","availability_of_handrails","furniture_availability","phy_lab_cond","chem_lab_cond","bio_lab_cond","math_lab_cond","lang_lab_cond","geo_lab_cond","comp_lab_cond","comp_ict_lab_yn","ict_lab_yn","laptop","tablet","desktop","digiboard","smart_class_tv_tot","projector","printer","internet","spl_educator_yn","librarian_yn","kitchen_garden_yn","tinkering_lab_yn","cyber_safety","psycho_social","enrichment_activities","match_confidence"];
const AI=Object.fromEntries(AF.map((x,i)=>[x,i]));
async function amenitiesFor(code,udise){
  try{
    if(!(code in amenCache)) amenCache[code]=(async()=>{
      try{
        const mf=await fetch('data/a/manifest.json').then(x=>x.ok?x.json():{});
        const parts=mf[code]||[];
        const objs=await Promise.all(parts.map(n=>fetch(`data/a/${n}`).then(x=>x.ok?x.json():{})));
        return Object.assign({},...objs);
      }catch(e){return {}}
    })();
    return (await amenCache[code])[String(udise)]||null;
  }catch(e){return null}
}
function yn(v){return v===1?'Yes':v===2?'No':'—'}
function elec(v){return v===1?'Yes':v===2?'No':v===3?'Available, not functional':'—'}
function num(v){return v===null||v===undefined||v===''?'—':String(v)}
function amenityPanel(a){
 if(!a)return `<div class="gov-head"><div class="gov-title">WHAT THE GOVERNMENT SAYS</div><div class="gov-year">UDISE+ · 2025–26</div><div class="gov-aside">According to UDISE+ 2025–26. Better to go and check yourself.</div></div>
<div class="unavailable"><strong>Amenities unavailable</strong><p>The government's public 2025–26 dataset does not allow us to reliably connect this school's identity to its amenities record. <b>We won't guess.</b></p><p>You can also look up this school on the <a href="https://kys.udiseplus.gov.in/" target="_blank" rel="noopener">official UDISE+ Know Your School website</a>. <em>(It's the official government website, so obviously it's not this cool.)</em></p></div>`;
 const x=k=>a[AI[k]], tile=(label,val,kind='')=>`<div class="amen ${kind}"><small>${label}</small><strong>${esc(val)}</strong></div>`;
 const water=(x('tap_fun_yn')===1||x('hand_pump_fun_yn')===1||x('well_prot_fun_yn')===1||x('pack_water_fun_yn')===1||x('othsrc_fun_yn')===1)?'Yes':
   (x('tap_yn')===1||x('hand_pump_yn')===1||x('well_prot_yn')===1||x('pack_water_yn')===1||x('othsrc_yn')===1)?'Source reported':'—';
 return `<div class="gov-head"><div class="gov-title">WHAT THE GOVERNMENT SAYS</div><div class="gov-year">UDISE+ · 2025–26</div><div class="gov-aside">According to UDISE+ 2025–26. Better to go and check yourself.</div></div><div class="sect">Amenities</div>
 <div class="amen-grid">
 ${tile('Functional drinking water',water)}
 ${tile('Electricity',elec(x('electricity_availability')))}
 ${tile('Girls’ toilets',`${num(x('total_girls_func_toilet'))} functional / ${num(x('total_girls_toilet'))} total`)}
 ${tile('Boys’ toilets',`${num(x('total_boys_func_toilet'))} functional / ${num(x('total_boys_toilet'))} total`)}
 ${tile('CWSN toilets',`${num(x('func_girls_cwsn_friendly')+(x('func_boys_cwsn_friendly')||0))} functional`)}
 ${tile('Handwash near toilets',yn(x('handwash_near_toilet')))}
 ${tile('Library',yn(x('library_availability')))}
 ${tile('Reading corner',yn(x('reading_corner')))}
 ${tile('Playground',yn(x('playground_available')))}
 ${tile('Ramp',yn(x('availability_ramps')))}
 ${tile('Handrails',yn(x('availability_of_handrails')))}
 ${tile('Internet',yn(x('internet')))}
 ${tile('ICT / computer lab',x('comp_ict_lab_yn')===1||x('ict_lab_yn')===1?'Yes':(x('comp_ict_lab_yn')===2&&x('ict_lab_yn')===2?'No':'—'))}
 ${tile('Computers',`${num(x('desktop'))} desktops · ${num(x('laptop'))} laptops · ${num(x('tablet'))} tablets`)}
 ${tile('Digital boards',num(x('digiboard')))}
 ${tile('Smart-class TVs',num(x('smart_class_tv_tot')))}
 ${tile('Solar panel',yn(x('solar_panel')))}
 ${tile('Rainwater harvesting',yn(x('rain_water_harvesting')))}
 ${tile('Kitchen garden',yn(x('kitchen_garden_yn')))}
 ${tile('Medical check-ups',yn(x('medical_checkups')))}
 </div>
 <div class="sect">Infrastructure</div>
 <div class="info">
 ${[['Classrooms',num(x('total_class_rooms'))],['Classrooms in good condition',num(x('classrooms_in_good_condition'))],['Need minor repair',num(x('classrooms_needs_minor_repair'))],['Need major repair',num(x('classrooms_needs_major_repair'))],['Special educator',yn(x('spl_educator_yn'))],['Full-time librarian',yn(x('librarian_yn'))],['Cyber-safety orientation',yn(x('cyber_safety'))]].map(([k,v])=>`<div class="row"><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}
 </div>
 <div class="amen-source">Amenities source: UDISE+ Data Sharing Portal, 2025–26 · Identity match confidence ${esc(a[AI.match_confidence])}</div>`;
}
async function openSchool(r){
 const st=states.find(x=>x.code===stateCode),students=r[F.students],teachers=r[F.teachers];
 $('#detail').innerHTML=`<div class="detail"><div class="code">UDISE ${esc(r[F.u])}</div><h2>${esc(r[F.n])}</h2><div class="sub">${esc(dict('v',r[F.v]))}, ${esc(dict('sd',r[F.sd]))}, ${esc(dict('d',r[F.d]))}, ${esc(st?.name)} ${esc(dict('p',r[F.p])==='—'?'':dict('p',r[F.p]))}</div><div class="tiny-wink">Official data, minus the official-looking website.</div><div class="actions"><button class="primary" id="shareStory">Share Story</button><button class="secondary" id="downloadStory">Download 1080×1920</button></div><div class="sect playful-sect">Quick look</div><div class="kpis"><div class="kpi"><strong>${fmt(students)}</strong><span>Students</span></div><div class="kpi"><strong>${fmt(teachers)}</strong><span>Teachers</span></div><div class="kpi"><strong>${fmt(r[F.rooms])}</strong><span>Classrooms</span></div><div class="kpi light"><strong>${ratio(students,teachers)}</strong><span>Student : teacher</span></div><div class="kpi light"><strong>${esc((r[F.from]??'—')+'–'+(r[F.to]??'—'))}</strong><span>Classes</span></div><div class="kpi light"><strong>${esc(r[F.est]??"—")}</strong><span>Established</span></div></div><div id="amenLoad"><div class="sect">Amenities</div><div class="amen-missing">Loading 2025–26 amenities…</div></div><div class="sect">School details</div><div class="info">${[['Management',dict('m',r[F.m])],['Category',dict('cat',r[F.cat])],['School type',dict('type',r[F.type])],['Location',dict('loc',r[F.loc])],['District',dict('d',r[F.d])],['Sub-district',dict('sd',r[F.sd])],['Cluster',dict('cl',r[F.cl])],['Village',dict('v',r[F.v])],['PIN code',dict('p',r[F.p])],['Pre-primary students',r[F.pre]],['Other rooms',r[F.other]],['Coordinates',r[F.lat]&&r[F.lon]?r[F.lat]+', '+r[F.lon]:null]].map(([k,v])=>`<div class="row"><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div><div class="independent-note"><b>BASED ON GOVERNMENT DATA.</b> NOT A GOVERNMENT WEBSITE.</div><div class="note"><strong>Data note:</strong> School identity/search fields use the earlier public UDISE directory snapshot. Where shown, amenities are from UDISE+ Data Sharing Portal 2025–26 and are displayed only for high-confidence A/B identity matches.</div></div>`;
 $('#dlg').showModal();
 const a=await amenitiesFor(stateCode,r[F.u]);
 const holder=$('#amenLoad'); if(holder)holder.innerHTML=amenityPanel(a);
 $('#shareStory').onclick=()=>story(r,true);$('#downloadStory').onclick=()=>story(r,false)
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}function wrap(c,t,x,y,w,lh,max){let ws=String(t).split(/\s+/),line='',ls=[];for(const z of ws){let q=line?line+' '+z:z;if(c.measureText(q).width>w&&line){ls.push(line);line=z;if(ls.length>=max)break}else line=q}if(ls.length<max&&line)ls.push(line);ls.forEach((z,i)=>c.fillText(z,x,y+i*lh));return y+ls.length*lh}
async function story(r,share){
 try{
   if(document.fonts&&document.fonts.load){
     await Promise.all([
       document.fonts.load('800 68px Manrope'),
       document.fonts.load('700 28px Manrope'),
       document.fonts.load('600 20px Manrope')
     ]);
   }
 }catch(e){}
 const st=states.find(x=>x.code===stateCode),W=1080,H=1920,p=72,cv=document.createElement('canvas'),c=cv.getContext('2d');cv.width=W;cv.height=H;
 const saff='#FF9933',green='#138808',blue='#000080',ink='#171A1F',muted='#667085',line='#E6E8EC',cream='#FFF7EE',mint='#F2FAF3',ice='#F5F6FF';
 const box=(x,y,w,h,fill,stroke=line,rad=26)=>{c.fillStyle=fill;rr(c,x,y,w,h,rad);c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke()};
 c.fillStyle='#fff';c.fillRect(0,0,W,H);
 c.fillStyle=saff;c.fillRect(0,0,360,14);c.fillStyle='#fff';c.fillRect(360,0,360,14);c.fillStyle=green;c.fillRect(720,0,360,14);

 c.fillStyle=blue;c.font='900 28px Manrope';c.fillText('SCHOOL RECORDS INDIA',p,82);
 c.fillStyle=ink;c.font='950 68px Manrope';let y=160;y=wrap(c,r[F.n],p,y,W-p*2,72,4)+18;
 c.fillStyle=muted;c.font='750 25px Manrope';c.fillText(`${dict('d',r[F.d])}, ${st?.name||''}`,p,y);y+=38;
 c.font='750 21px Manrope';c.fillText(`UDISE ${r[F.u]}`,p,y);y+=70;

 c.fillStyle=saff;c.font='950 29px Manrope';c.fillText('WHAT THE GOVERNMENT SAYS',p,y);
 c.fillStyle=green;c.font='900 21px Manrope';c.fillText('UDISE+ · 2025–26',p,y+38);y+=78;

 const a=await amenitiesFor(stateCode,r[F.u]);
 if(a){
   const x=k=>a[AI[k]], water=(x('tap_fun_yn')===1||x('hand_pump_fun_yn')===1||x('well_prot_fun_yn')===1||x('pack_water_fun_yn')===1||x('othsrc_fun_yn')===1)?'Yes':'—';
   c.fillStyle=ink;c.font='950 42px Manrope';c.fillText('AMENITIES',p,y);y+=28;
   const vals=[
    ['DRINKING WATER',water],['ELECTRICITY',elec(x('electricity_availability'))],
    ['GIRLS’ TOILETS',`${num(x('total_girls_func_toilet'))}/${num(x('total_girls_toilet'))} functional`],
    ['BOYS’ TOILETS',`${num(x('total_boys_func_toilet'))}/${num(x('total_boys_toilet'))} functional`],
    ['LIBRARY',yn(x('library_availability'))],['PLAYGROUND',yn(x('playground_available'))],
    ['INTERNET',yn(x('internet'))],['ICT / COMPUTER LAB',x('comp_ict_lab_yn')===1||x('ict_lab_yn')===1?'Yes':'No'],
    ['RAMP',yn(x('availability_ramps'))],['HANDWASH',yn(x('handwash_near_toilet'))]
   ];
   vals.forEach((it,i)=>{
     const col=i%2,row=Math.floor(i/2),xx=p+col*472,yy=y+row*124;
     const val=String(it[1]), positive=val==='Yes'||(/functional/.test(val)&&!val.startsWith('0/'));
     box(xx,yy,444,104,positive?mint:(i%3===0?cream:'#fff'));
     c.fillStyle=muted;c.font='850 16px Manrope';c.fillText(it[0],xx+22,yy+31);
     c.fillStyle=positive?green:ink;c.font='950 29px Manrope';wrap(c,val,xx+22,yy+72,398,32,2);
   });
   y+=5*124+36;
 } else {
   box(p,y,W-p*2,350,cream,'#FFD7B5',30);
   c.fillStyle=saff;c.font='950 28px Manrope';c.fillText('AMENITIES',p+30,y+52);
   c.fillStyle=ink;c.font='950 61px Manrope';c.fillText('DATA UNAVAILABLE.',p+30,y+128);
   c.font='750 25px Manrope';
   wrap(c,"The government's public 2025–26 dataset doesn't let us reliably connect this school to its amenities record.",p+30,y+184,W-p*2-60,35,3);
   c.fillStyle=green;c.font='950 32px Manrope';c.fillText("So we won't guess.",p+30,y+310);
   y+=390;
 }

 // School facts as individual, friendly cards.
 c.fillStyle=ink;c.font='950 31px Manrope';c.fillText('QUICK LOOK',p,y);y+=26;
 const facts=[
   [fmt(r[F.students]),'STUDENTS',cream],
   [fmt(r[F.teachers]),'TEACHERS',mint],
   [fmt(r[F.rooms]),'CLASSROOMS',ice],
   [`${r[F.low]??'—'}–${r[F.high]??'—'}`,'CLASSES','#FAFAFA'],
   [String(r[F.est]??'—'),'ESTABLISHED','#FAFAFA']
 ];
 const gap=16, bw=(W-p*2-gap)/2, bh=138;
 facts.forEach((it,i)=>{
   let xx,yy,w=bw;
   if(i<4){xx=p+(i%2)*(bw+gap);yy=y+Math.floor(i/2)*(bh+gap)}
   else {xx=p;yy=y+2*(bh+gap);w=W-p*2}
   box(xx,yy,w,bh,it[2]);
   c.fillStyle=blue;c.font='950 43px Manrope';c.fillText(it[0],xx+24,yy+62);
   c.fillStyle=muted;c.font='850 16px Manrope';c.fillText(it[1],xx+24,yy+96);
 });
 y+=3*(bh+gap)+34;

 // Bottom identity panel, deliberately close to content: no dead story space.
 box(p,y,W-p*2,190,'#171A1F','#171A1F',28);
 c.fillStyle='#fff';c.font='950 24px Manrope';c.fillText('BASED ON GOVERNMENT DATA.',p+28,y+52);
 c.fillStyle='#FFB266';c.fillText('NOT A GOVERNMENT WEBSITE.',p+28,y+90);
 c.fillStyle='#D0D5DD';c.font='700 17px Manrope';c.fillText('Official amenities source: UDISE+ · 2025–26',p+28,y+132);
 c.fillStyle='#8ED59A';c.font='900 18px Manrope';c.fillText('SCHOOL RECORDS INDIA',p+28,y+165);
const blob=await new Promise(z=>cv.toBlob(z,'image/png')),file=new File([blob],`school-${r[F.u]}-story.png`,{type:'image/png'});
 if(share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:r[F.n]});return}catch(e){}}
 const ae=document.createElement('a');ae.href=URL.createObjectURL(blob);ae.download=file.name;ae.click();setTimeout(()=>URL.revokeObjectURL(ae.href),1500)
}
init();