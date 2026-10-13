const $ = id => document.getElementById(id);
const DB_KEY = "qing-shi-diary-v1";
const mealOrder = ["早餐","午餐","晚餐","加餐"];
const icons = {"早餐":"☀️","午餐":"🍚","晚餐":"🥗","加餐":"🍎"};
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
let state = loadState(), selectedDate = todayISO(), editingId = null;
function loadState(){try{return Object.assign({entries:[],weights:[],goal:1800},JSON.parse(localStorage.getItem(DB_KEY)||"{}"));}catch(e){return {entries:[],weights:[],goal:1800};}}
function saveState(){localStorage.setItem(DB_KEY,JSON.stringify(state));render();}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function num(id){return Math.max(0,Number($(id).value)||0);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function kcal(n){return Math.round(n||0).toLocaleString("zh-CN");}
function dateText(s){const d=new Date(s+"T12:00:00");return `${d.getMonth()+1}月${d.getDate()}日 ${["周日","周一","周二","周三","周四","周五","周六"][d.getDay()]}`;}
function totals(entries){return entries.reduce((a,e)=>{a.calories+=+e.calories||0;a.protein+=+e.protein||0;a.carbs+=+e.carbs||0;a.fat+=+e.fat||0;return a;},{calories:0,protein:0,carbs:0,fat:0});}
function render(){
  $("dateInput").value=selectedDate;$("dateLabel").textContent=selectedDate===todayISO()?"今天 · "+dateText(selectedDate):dateText(selectedDate);
  const list=state.entries.filter(e=>e.date===selectedDate), t=totals(list), goal=Number(state.goal)||1800, remaining=goal-t.calories, pct=Math.min(100,Math.round(t.calories/goal*100));
  $("totalCalories").textContent=kcal(t.calories);$("remaining").textContent=remaining<0?"+"+kcal(-remaining):kcal(remaining);$("goalLabel").textContent=kcal(goal);$("progressLabel").textContent=pct+"%";
  $("calorieProgress").style.width=pct+"%";$("calorieRing").style.background=`conic-gradient(#d7e5ca ${pct*3.6}deg,rgba(255,255,255,.18) 0deg)`;
  $("proteinTotal").textContent=t.protein.toFixed(1).replace(/\.0$/,"")+" g";$("carbsTotal").textContent=t.carbs.toFixed(1).replace(/\.0$/,"")+" g";$("fatTotal").textContent=t.fat.toFixed(1).replace(/\.0$/,"")+" g";
  $("proteinBar").style.width=Math.min(100,t.protein/100*100)+"%";$("carbsBar").style.width=Math.min(100,t.carbs/220*100)+"%";$("fatBar").style.width=Math.min(100,t.fat/60*100)+"%";
  const groups=mealOrder.map(meal=>({meal,items:list.filter(e=>e.meal===meal)})).filter(g=>g.items.length);
  $("mealList").innerHTML=groups.length?groups.map(g=>`<section class="meal-group"><div class="meal-group-head"><strong>${icons[g.meal]||"🍽️"} ${g.meal}</strong><span>${kcal(totals(g.items).calories)} kcal</span></div>${g.items.map(e=>`<div class="food-row"><div class="food-symbol">${icons[e.meal]||"🍽️"}</div><div class="food-main"><strong>${esc(e.name)}</strong><small>${esc(e.portion||"未填写份量")}${e.note?" · "+esc(e.note):""}</small></div><div class="food-cal">${kcal(e.calories)}<small> kcal</small></div><button class="edit-food" aria-label="编辑食物" data-edit="${e.id}">•••</button></div>`).join("")}</section>`).join(""):`<div class="empty-state"><div class="bowl">🥣</div><strong>今天还没有饮食记录</strong><p>从第一餐开始记下来吧。<br>不需要一次就完美，持续记录更重要。</p></div>`;
  document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openEntry(b.dataset.edit)));
  $("goalInput").value=state.goal;
}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2300);}
function show(id){$(id).showModal();}
function close(id){$(id).close();}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>close(b.dataset.close)));
$("prevDay").onclick=()=>shiftDay(-1);$("nextDay").onclick=()=>shiftDay(1);$("dateInput").onchange=e=>{selectedDate=e.target.value||todayISO();render();};
function shiftDay(n){const d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()+n);selectedDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;render();}
$("addBtn").onclick=()=>openEntry();
function openEntry(id=null){
  editingId=id;const e=id?state.entries.find(x=>x.id===id):null;
  $("entryTitle").textContent=e?"编辑饮食记录":"记一笔饮食";$("deleteEntryBtn").hidden=!e;
  $("foodName").value=e?.name||"";$("mealType").value=e?.meal||"早餐";$("portion").value=e?.portion||"";$("foodCalories").value=e?.calories??"";$("foodProtein").value=e?.protein??0;$("foodCarbs").value=e?.carbs??0;$("foodFat").value=e?.fat??0;$("foodNote").value=e?.note||"";
  show("entryDialog");
}
$("entryForm").onsubmit=e=>{
  e.preventDefault();const item={id:editingId||uid(),date:editingId?(state.entries.find(x=>x.id===editingId)?.date||selectedDate):selectedDate,name:$("foodName").value.trim(),meal:$("mealType").value,portion:$("portion").value.trim(),calories:num("foodCalories"),protein:num("foodProtein"),carbs:num("foodCarbs"),fat:num("foodFat"),note:$("foodNote").value.trim(),updatedAt:new Date().toISOString()};
  if(!item.name){toast("请填写食物名称");return;}
  if(editingId)state.entries=state.entries.map(x=>x.id===editingId?item:x);else state.entries.push(item);
  close("entryDialog");saveState();toast("已保存到本机");
};
$("deleteEntryBtn").onclick=()=>{if(editingId&&confirm("确定删除这条饮食记录吗？")){state.entries=state.entries.filter(x=>x.id!==editingId);close("entryDialog");saveState();toast("已删除");}};
$("settingsBtn").onclick=()=>show("settingsDialog");
$("saveSettingsBtn").onclick=()=>{state.goal=Math.min(10000,Math.max(500,Number($("goalInput").value)||1800));saveState();close("settingsDialog");toast("目标已更新");};
$("aiBtn").onclick=()=>show("aiDialog");
const promptText=`请帮我根据我上传的食物照片估算每种食物的热量和营养素。请仔细判断食物种类、可见份量、烹饪方式和可能的油/酱料；看不清的部分请说明不确定性，不要假装精确。请只返回合法 JSON，不要使用 Markdown 代码围栏，格式如下：\n{"foods":[{"name":"食物名称","portion":"估算份量，如约150g","calories":整数kcal,"protein":蛋白质克数,"carbs":碳水克数,"fat":脂肪克数,"meal":"早餐/午餐/晚餐/加餐","note":"估算依据或不确定性"}]}\n所有营养数值均为估算值。若照片中有多种食物，请分别列出。`;
$("copyPromptBtn").onclick=async()=>{try{await navigator.clipboard.writeText(promptText);toast("提示词已复制；去 ChatGPT 上传照片即可");}catch(e){$("aiJson").value=promptText;toast("复制失败，请长按复制提示词");}};
$("parseAiBtn").onclick=()=>{
  let raw=$("aiJson").value.trim();if(!raw){toast("先粘贴 ChatGPT 返回的 JSON");return;}
  raw=raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  try{const obj=JSON.parse(raw), foods=Array.isArray(obj)?obj:(obj.foods||[obj]);if(!foods.length)throw new Error("没有找到食物");
    const mealDefault="午餐";let added=0;
    foods.forEach(f=>{if(!f.name||!Number.isFinite(Number(f.calories)))return;state.entries.push({id:uid(),date:selectedDate,name:String(f.name),meal:mealOrder.includes(f.meal)?f.meal:mealDefault,portion:String(f.portion||""),calories:Math.max(0,Number(f.calories)||0),protein:Math.max(0,Number(f.protein)||0),carbs:Math.max(0,Number(f.carbs)||0),fat:Math.max(0,Number(f.fat)||0),note:String(f.note||"AI估算"),updatedAt:new Date().toISOString()});added++;});
    if(!added)throw new Error("JSON 中没有可导入的食物项");close("aiDialog");$("aiJson").value="";saveState();toast(`已添加 ${added} 项，请核对餐次和数值`);
  }catch(e){toast("JSON 解析失败："+e.message+"；请确认复制完整");}
};
$("weightBtn").onclick=()=>{const existing=state.weights.find(w=>w.date===selectedDate);$("weightInput").value=existing?.weight||"";const recent=[...state.weights].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);$("weightHistory").textContent=recent.length?"最近记录："+recent.map(w=>`${w.date} ${w.weight}kg`).join(" · "):"还没有体重记录。";show("weightDialog");};
$("saveWeightBtn").onclick=()=>{const w=Number($("weightInput").value);if(!w||w<20||w>400){toast("请输入合理的体重数值");return;}state.weights=state.weights.filter(x=>x.date!==selectedDate);state.weights.push({date:selectedDate,weight:w});close("weightDialog");saveState();toast("体重已记录");};
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`轻食日记备份-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);toast("已生成备份文件");};
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.entries))throw new Error("文件格式不正确");if(!confirm(`备份中有 ${data.entries.length} 条饮食记录。确定导入并合并到当前数据吗？`))return;const ids=new Set(state.entries.map(x=>x.id));state.entries.push(...data.entries.filter(x=>!ids.has(x.id)));if(Array.isArray(data.weights)){const keys=new Set(state.weights.map(x=>x.date));state.weights.push(...data.weights.filter(x=>!keys.has(x.date)));}if(data.goal)state.goal=data.goal;saveState();toast("备份导入完成");}catch(err){toast("导入失败："+err.message);}finally{e.target.value="";}};
$("statsBtn").onclick=()=>{
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const es=state.entries.filter(e=>e.date===s);days.push({date:s,total:totals(es),count:es.length});}
  const recorded=days.filter(d=>d.count), avg=recorded.length?recorded.reduce((a,d)=>a+d.total.calories,0)/recorded.length:0, hit=recorded.filter(d=>d.total.calories<=state.goal&&d.total.calories>0).length;
  $("statsContent").innerHTML=`<div class="stat-tile"><span>近 7 天有记录的天数</span><strong>${recorded.length} / 7 天</strong><p>记录习惯比单日数字更重要。</p></div><div class="stat-tile"><span>有记录日期的日均摄入</span><strong>${kcal(avg)} kcal</strong><p>只计算至少记录了一项食物的日期。</p></div><div class="stat-tile"><span>摄入不高于目标的天数</span><strong>${hit} 天</strong><p>仅作记录参考，不代表目标一定适合你。</p></div><div class="stat-tile"><span>最近 7 天</span>${days.map(d=>`<p>${dateText(d.date)}　${d.count?kcal(d.total.calories)+" kcal":"暂无记录"}</p>`).join("")}</div>`;
  show("statsDialog");
};
$("dataBtn").onclick=()=>show("dataDialog");
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();