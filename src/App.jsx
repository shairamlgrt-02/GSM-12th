import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, addDoc, deleteDoc } from 'firebase/firestore';

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const due = new Date(dateStr);
  return due < today;
};

export default function ChurchPortal() {
  const [view, setView] = useState('public');
  const [activeTab, setActiveTab] = useState('vision');
  const [adminActiveTab, setAdminActiveTab] = useState('settings');
  const [activeProgramId, setActiveProgramId] = useState(null); 
  const [isBanquet, setIsBanquet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  
  const [masterEvents, setMasterEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null); 
  const [activeEventSubTab, setActiveEventSubTab] = useState(null); 

  const [program, setProgram] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [catering, setCatering] = useState([]);
  const [logisticsCards, setLogisticsCards] = useState([]);
  const [mapObjects, setMapObjects] = useState([]);
  const [siteContent, setSiteContent] = useState(null);

  const [visionActs, setVisionActs] = useState(() => {
    const saved = localStorage.getItem('gsm_vision_cache');
    return saved ? JSON.parse(saved) : [];
  });

  const SECRET_CODE = 'GSM2026';

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);
    onSnapshot(doc(db, 'site', 'content'), (snap) => snap.exists() && setSiteContent(snap.data()));
    onSnapshot(query(collection(db, 'program'), orderBy('time')), (snap) => setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'committees'), (snap) => setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'catering'), (snap) => setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'logisticsCards'), (snap) => setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'masterEvents'), (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMasterEvents(events);
      if (events.length > 0 && !activeEventSubTab) setActiveEventSubTab(events[0].id);
      if (events.length > 0 && !activeEventId) setActiveEventId(events[0].id);
    });
    onSnapshot(collection(db, 'visionActs'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisionActs(data);
      localStorage.setItem('gsm_vision_cache', JSON.stringify(data));
    });
    onSnapshot(collection(db, 'mapObjects'), (snap) => setMapObjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const updateField = async (col, id, data) => await updateDoc(doc(db, col, id), data);
  const updateSite = async (data) => await setDoc(doc(db, 'site', 'content'), data, { merge: true });
  const addItem = async (col, data) => await addDoc(collection(db, col), data);
  const removeItem = async (col, id, label) => {
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) await deleteDoc(doc(db, col, id));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setIsAdmin(false);
      setView('public');
      localStorage.removeItem('gsm_admin');
    }
  };

  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === SECRET_CODE) { 
      setIsAdmin(true); setView('admin'); setShowPasscodeModal(false); localStorage.setItem('gsm_admin', 'true'); 
    } else { alert('Invalid Code'); }
  };

  const MapRenderer = ({ mode, isAdminView = false }) => (
    <div className="relative w-full aspect-[1.8/1] md:aspect-[2.2/1] border-[2px] border-[#2D2D2D] bg-white overflow-hidden rounded-md mx-auto max-w-[700px]">
      {mapObjects.filter(obj => mode === 'banquet' ? obj.showInBanquet : obj.showInService).map(obj => (
        <div 
          key={obj.id} 
          onClick={() => {
            if (isAdminView) {
              const element = document.getElementById(`edit-${obj.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-emerald-500');
                setTimeout(() => element.classList.remove('ring-2', 'ring-emerald-500'), 2000);
              }
            }
          }}
          className={`absolute flex items-center justify-center transition-all cursor-pointer ${obj.type === 'room' ? 'border border-black bg-black/5' : obj.type === 'block' ? 'bg-emerald-500/5 border border-emerald-900/10' : obj.type === 'icon' ? 'bg-blue-500 rounded-full border border-white shadow-sm' : 'bg-orange-400 border border-orange-600 shadow-sm'}`} 
          style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%`, zIndex: 10 }}
        >
          {obj.label && <span className="text-black text-[5px] md:text-[8px] font-black uppercase tracking-tighter text-center leading-none px-0.5">{obj.label}</span>}
          {obj.type === 'block' && (
            <div className="absolute inset-0 p-1 gap-1 grid" style={{ gridTemplateColumns: `repeat(${obj.cols || 4}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${obj.rows || 6}, minmax(0, 1fr))` }}>
              {Array.from({ length: (obj.rows || 6) * (obj.cols || 4) }).map((_, i) => (<div key={i} className="w-0.5 h-0.5 md:w-1 md:h-1 bg-emerald-600 rounded-full opacity-40 mx-auto" />))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-[10px]">
        <nav className="bg-white border-b p-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
          <h1 className="font-serif italic font-bold text-emerald-900 text-xl">GSM Master Backend</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('public')} className="text-[10px] font-bold uppercase px-6 py-2 border border-emerald-900 text-emerald-900 rounded-full hover:bg-emerald-50 transition-all">View Site</button>
            <button onClick={handleLogout} className="text-[10px] font-bold uppercase px-6 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">Logout</button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar justify-center">
            {['settings', 'vision', 'floor', 'program', 'logistics', 'committees'].map(t => (
              <button key={t} onClick={() => setAdminActiveTab(t)} className={`px-6 py-2 rounded-full font-bold uppercase border transition-all whitespace-nowrap ${adminActiveTab === t ? 'bg-emerald-900 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                {t === 'program' ? 'Events Manager' : t}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 md:p-10 rounded-3xl border shadow-sm min-h-[600px]">
            {adminActiveTab === 'settings' && (
              <div className="space-y-8 max-w-2xl animate-in fade-in">
                <h3 className="font-bold text-emerald-900 text-[10px] uppercase border-b pb-2 tracking-widest italic">Branding Architect</h3>
                <div className="grid grid-cols-1 gap-6 bg-slate-50 p-6 rounded-3xl border shadow-inner">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Main Title</label><input className="w-full p-3 border rounded-xl mt-1 text-sm font-serif italic outline-none focus:border-emerald-900" defaultValue={siteContent?.mainTitle} onBlur={(e) => updateSite({ mainTitle: e.target.value })} /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Subtitle</label><input className="w-full p-3 border rounded-xl mt-1 text-[11px] font-bold tracking-[0.2em] outline-none" defaultValue={siteContent?.subTitle} onBlur={(e) => updateSite({ subTitle: e.target.value })} /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Verse</label><textarea className="w-full p-3 border rounded-xl mt-1 h-28 text-xs font-serif italic outline-none focus:border-emerald-900" defaultValue={siteContent?.verse} onBlur={(e) => updateSite({ verse: e.target.value })} /></div>
                </div>
              </div>
            )}

            {adminActiveTab === 'vision' && (
              <div className="space-y-10 animate-in fade-in">
                <div className="bg-emerald-900 p-6 rounded-3xl border text-white space-y-6 shadow-xl">
                  <h3 className="font-bold text-[#C5A021] text-[10px] uppercase tracking-[0.2em]">The 4 Spiritual Pillars</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800 space-y-2 shadow-inner">
                        <label className="text-[8px] font-black text-[#C5A021] uppercase">Pillar {num} Title</label>
                        <input className="w-full bg-transparent border-b border-emerald-700 text-xs font-bold outline-none" defaultValue={siteContent?.[`pillar${num}Title`]} onBlur={(e) => updateSite({ [`pillar${num}Title`]: e.target.value })} />
                        <label className="text-[8px] font-black text-[#C5A021] uppercase block mt-2">Description</label>
                        <textarea className="w-full bg-transparent border border-emerald-800 text-[10px] rounded h-16 outline-none p-2" defaultValue={siteContent?.[`pillar${num}Desc`]} onBlur={(e) => updateSite({ [`pillar${num}Desc`]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-2"><h3 className="font-bold text-emerald-900 text-xs uppercase">Vision Acts Architect</h3><button onClick={() => addItem('visionActs', { title: '', desc: '' })} className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-4 py-2 rounded-full shadow-sm">+ ADD ACT</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visionActs.map(act => (
                      <div key={act.id} className="p-4 bg-slate-50 rounded-2xl relative border shadow-sm group">
                        <button onClick={() => removeItem('visionActs', act.id, 'act')} className="absolute top-3 right-3 text-red-200 group-hover:text-red-400 transition-colors">×</button>
                        <input className="font-bold text-emerald-900 text-xs w-full bg-transparent border-b border-dashed mb-2 outline-none" defaultValue={act.title} onBlur={(e) => updateField('visionActs', act.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] p-2 rounded-xl border bg-white h-20 outline-none" defaultValue={act.desc} onBlur={(e) => updateField('visionActs', act.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'floor' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4 shadow-inner">
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase italic tracking-widest">MAP LABELS ARCHITECT</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {['mapHeader', 'legendRooms', 'legendSeating', 'legendEntry', 'legendBanquet'].map(f => (
                      <div key={f}>
                        <label className="text-[8px] font-black uppercase text-slate-400">{f}</label>
                        <input className="w-full p-2 text-xs border rounded-lg mt-1 outline-none" defaultValue={siteContent?.[f]} onBlur={(e) => updateSite({ [f]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm">
                       <span className="font-bold text-emerald-900 uppercase text-[9px] tracking-widest">MAP: {isBanquet ? 'BANQUET' : 'SERVICE'} MODE</span>
                       <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase shadow-md transition-all active:scale-95">
                         SWITCH TO {isBanquet ? 'SERVICE' : 'BANQUET'}
                       </button>
                    </div>
                    <MapRenderer mode={isBanquet ? 'banquet' : 'service'} isAdminView={true} />
                  </div>

                  <div className="lg:col-span-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar border-l pl-4">
                    <button onClick={() => addItem('mapObjects', { type: 'room', label: 'New', x: 20, y: 20, w: 15, h: 15, showInService: true, showInBanquet: true, rows: 6, cols: 4 })} className="w-full py-4 bg-emerald-900 text-white rounded-xl font-bold text-[10px] uppercase shadow-md sticky top-0 z-10 hover:bg-[#1e3a2f] transition-colors">+ CREATE OBJECT</button>
                    {mapObjects.map(obj => (
                      <div key={obj.id} id={`edit-${obj.id}`} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm space-y-3 relative group transition-all">
                        <div className="flex justify-between items-center font-bold">
                          <select className="text-[9px] outline-none bg-transparent" value={obj.type} onChange={(e) => updateField('mapObjects', obj.id, { type: e.target.value })}>
                            <option value="room">Room</option><option value="block">Seating</option><option value="icon">Icon</option>
                          </select>
                          <button onClick={() => removeItem('mapObjects', obj.id, 'object')} className="text-red-300 hover:text-red-500 text-lg leading-none">×</button>
                        </div>
                        <input className="w-full p-1 text-[10px] border-b outline-none font-bold bg-transparent" value={obj.label} onChange={(e) => updateField('mapObjects', obj.id, { label: e.target.value })} />
                        <div className="grid grid-cols-4 gap-2">
                          {['x', 'y', 'w', 'h'].map(f => (
                            <div key={f} className="flex flex-col">
                              <label className="text-[6px] font-black uppercase text-slate-300">{f}</label>
                              <input type="number" step="0.1" className="p-1 border border-slate-50 rounded text-[9px] outline-none" value={obj[f]} onChange={(e) => updateField('mapObjects', obj.id, { [f]: parseFloat(e.target.value) })} />
                            </div>
                          ))}
                        </div>
                        {obj.type === 'block' && (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                            {['rows', 'cols'].map(f => (
                              <div key={f} className="flex flex-col">
                                <label className="text-[6px] font-black uppercase text-slate-300">{f}</label>
                                <input type="number" className="p-1 border border-slate-50 rounded text-[9px] outline-none" value={obj[f]} onChange={(e) => updateField('mapObjects', obj.id, { [f]: parseInt(e.target.value) })} />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-4 pt-1 justify-between border-t border-slate-50 mt-2">
                          <label className="text-[7px] font-bold flex items-center gap-1.5 cursor-pointer uppercase opacity-60"><input type="checkbox" className="accent-emerald-900" checked={obj.showInService} onChange={(e) => updateField('mapObjects', obj.id, { showInService: e.target.checked })} /> SVC</label>
                          <label className="text-[7px] font-bold flex items-center gap-1.5 cursor-pointer uppercase opacity-60"><input type="checkbox" className="accent-emerald-900" checked={obj.showInBanquet} onChange={(e) => updateField('mapObjects', obj.id, { showInBanquet: e.target.checked })} /> BNQ</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'program' && (
              <div className="space-y-10 animate-in fade-in">
                <div className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col md:flex-row gap-4 items-end shadow-xl">
                  <div className="flex-1">
                    <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">New Event Tab Name</label>
                    <input id="newEvName" className="w-full bg-transparent border-b border-slate-700 p-2 text-sm font-bold outline-none focus:border-[#C5A021]" placeholder="e.g. 14-Day Fasting" />
                  </div>
                  <button onClick={() => { const name = document.getElementById('newEvName').value; if (name) addItem('masterEvents', { name, programHeader: 'Program Flow' }); }} className="bg-[#C5A021] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-md">Create Module</button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar border-b pb-4">
                  {masterEvents.map(ev => (
                    <button key={ev.id} onClick={() => setActiveEventId(ev.id)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all shadow-sm ${activeEventId === ev.id ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-400 border'}`}>
                      {ev.name}
                    </button>
                  ))}
                </div>
                {activeEventId && (
                  <div className="space-y-10">
                    <div className="bg-slate-50 p-6 rounded-3xl border shadow-inner">
                      <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">{masterEvents.find(e => e.id === activeEventId)?.name} Flow</h3>
                        <button onClick={() => addItem('program', { parentId: activeEventId, time: '00:00', activity: '', remarks: '', description: '' })} className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-4 py-1.5 rounded-full shadow-sm">+ ADD SLOT</button>
                      </div>
                      <div className="space-y-3">
                        {program.filter(p => p.parentId === activeEventId).map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 relative group">
                            <button onClick={() => removeItem('program', item.id, 'slot')} className="absolute top-2 right-2 text-red-200 hover:text-red-400 transition-colors">×</button>
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-4 md:col-span-2"><label className="text-[7px] font-black text-slate-300 uppercase">Time</label><input className="w-full p-2 text-[10px] font-bold border rounded-lg bg-slate-50 outline-none" defaultValue={item.time} onBlur={(e) => updateField('program', item.id, { time: e.target.value })} /></div>
                              <div className="col-span-8 md:col-span-10"><label className="text-[7px] font-black text-slate-300 uppercase">Activity Name</label><input className="w-full p-2 text-[10px] font-bold border rounded-lg outline-none" defaultValue={item.activity} onBlur={(e) => updateField('program', item.id, { activity: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div><label className="text-[7px] font-black text-slate-300 uppercase">Lead / Remarks</label><input className="w-full p-2 text-[10px] border rounded-lg italic outline-none" defaultValue={item.remarks} onBlur={(e) => updateField('program', item.id, { remarks: e.target.value })} /></div>
                              <div><label className="text-[7px] font-black text-slate-300 uppercase">Description</label><textarea className="w-full p-2 text-[10px] border rounded-lg h-12 outline-none" defaultValue={item.description} onBlur={(e) => updateField('program', item.id, { description: e.target.value })} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-l-8 border-[#C5A021] shadow-sm">
                      <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">Event Specific Cards</h3>
                        <button onClick={() => addItem('logisticsCards', { parentId: activeEventId, title: 'New Note', desc: '' })} className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-4 py-1.5 rounded-full shadow-sm">+ ADD NOTE CARD</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {logisticsCards.filter(c => c.parentId === activeEventId).map(card => (
                          <div key={card.id} className="p-3 bg-white border rounded-2xl relative shadow-sm group">
                            <button onClick={() => removeItem('logisticsCards', card.id, 'card')} className="absolute top-2 right-2 text-red-100 group-hover:text-red-400">×</button>
                            <input className="font-bold uppercase text-[10px] text-emerald-900 w-full mb-2 border-b border-dashed outline-none" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                            <textarea className="w-full text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl h-24 outline-none resize-none" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminActiveTab === 'logistics' && (
              <div className="space-y-12 animate-in fade-in">
                <div className="bg-slate-50 p-8 rounded-3xl border shadow-inner space-y-4">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Catering Title Architect</label>
                  <input className="w-full p-3 border rounded-xl font-serif italic text-base outline-none bg-white shadow-sm" defaultValue={siteContent?.cateringHeader} onBlur={(e) => updateSite({ cateringHeader: e.target.value })} />
                  <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-emerald-900 text-[9px] uppercase">Catering Matrix</h3><button onClick={() => addItem('catering', { group: '', dish: '' })} className="text-emerald-700 font-bold text-[8px] bg-emerald-50 px-3 py-1 rounded-full shadow-sm">+ ADD GROUP</button></div>
                    <div className="space-y-1">
                      {catering.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 py-1 items-center border-b border-slate-50 group">
                          <input className="col-span-4 text-[10px] font-black uppercase outline-none bg-transparent" defaultValue={item.group} onBlur={(e) => updateField('catering', item.id, { group: e.target.value })} />
                          <input className="col-span-7 text-[10px] font-bold outline-none bg-transparent" defaultValue={item.dish} onBlur={(e) => updateField('catering', item.id, { dish: e.target.value })} />
                          <button onClick={() => removeItem('catering', item.id, 'item')} className="col-span-1 text-red-100 group-hover:text-red-400 text-right">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-l-8 border-slate-400 shadow-sm">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-emerald-900 text-[9px] uppercase">Global Information Cards</h3><button onClick={() => addItem('logisticsCards', { title: 'New', desc: '' })} className="text-emerald-700 font-bold text-[8px] bg-emerald-50 px-4 py-1.5 rounded-full shadow-sm">+ ADD CARD</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logisticsCards.filter(c => !c.parentId).map(card => (
                      <div key={card.id} className="p-4 bg-white border rounded-2xl relative shadow-sm group">
                        <button onClick={() => removeItem('logisticsCards', card.id, 'card')} className="absolute top-2 right-2 text-red-100 group-hover:text-red-400">×</button>
                        <input className="font-black uppercase text-[10px] text-emerald-900 w-full mb-2 border-b border-dashed outline-none" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] text-slate-600 bg-slate-50 p-3 rounded-xl h-24 outline-none resize-none" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'committees' && (
              <div className="space-y-8 animate-in fade-in">
                <button onClick={() => addItem('committees', { title: 'New Dept', team: 'TBD', tasks: [] })} className="w-full border-2 border-dashed p-10 text-slate-400 rounded-3xl uppercase font-bold text-[10px] hover:bg-slate-50 hover:text-emerald-900 transition-all">+ ADD GLOBAL DEPARTMENT</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {committees.map(comm => (
                    <div key={comm.id} className="p-6 bg-slate-50 rounded-2xl border relative space-y-4 shadow-sm group">
                      <button onClick={() => removeItem('committees', comm.id, 'committee')} className="absolute top-4 right-4 text-red-200 group-hover:text-red-400">×</button>
                      <input className="font-black uppercase text-xs w-full bg-transparent border-b-2 border-slate-900 outline-none pb-1 tracking-widest" defaultValue={comm.title} onBlur={(e) => updateField('committees', comm.id, { title: e.target.value })} />
                      <div className="space-y-3">
                        {comm.tasks?.map((t, i) => (
                          <div key={i} className="p-3 bg-white rounded-xl border shadow-sm space-y-2 relative group/task">
                            <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-300 uppercase">Task {i + 1}</span><button className="text-red-300 text-[10px] opacity-0 group-hover/task:opacity-100" onClick={async () => { const ts = comm.tasks.filter((_, idx) => idx !== i); await updateField('committees', comm.id, { tasks: ts }); }}>Remove</button></div>
                            <textarea className="w-full text-[11px] p-1 border-b outline-none bg-transparent h-6 resize-none" defaultValue={t.text} onBlur={(e) => { let ts = [...comm.tasks]; ts[i].text = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} />
                            <div className="grid grid-cols-2 gap-2"><input type="date" className="text-[10px] p-1.5 border rounded-lg outline-none bg-slate-50" defaultValue={t.dueDate} onChange={(e) => { let ts = [...comm.tasks]; ts[i].dueDate = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /><input type="text" className="text-[10px] p-1.5 border rounded-lg outline-none bg-slate-50 font-bold uppercase" placeholder="User" defaultValue={t.assignee} onBlur={(e) => { let ts = [...comm.tasks]; ts[i].assignee = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /></div>
                          </div>
                        ))}
                        <button className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all" onClick={async () => { const ts = [...(comm.tasks || []), { text: '', completed: false, dueDate: '', assignee: '' }]; await updateField('committees', comm.id, { tasks: ts }); }}>+ Add Task Item</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (!siteContent) return (
    <div className="min-h-screen bg-[#FCFBF4] flex flex-col items-center justify-center gap-4 animate-pulse text-center">
      <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="GSM Logo" className="w-16 h-16 md:w-24 object-contain" />
      <div className="font-bold text-emerald-900 text-lg md:text-2xl tracking-tighter">GSM <span className="font-light italic text-[#C5A021]">12th Anniversary</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D] selection:bg-emerald-100">
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-3 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter w-[20%] uppercase">GSM <span className="font-light italic text-[#C5A021] hidden md:inline">12th Anniversary</span></div>
        <div className="flex justify-center items-center flex-1 gap-1 md:gap-6">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`text-[7px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] border-b-2 py-1 transition-all whitespace-nowrap ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'}`}>{t === 'checklist' ? 'Committees' : t}</button>
          ))}
        </div>
        <div className="w-[20%] flex justify-end">
          <button onClick={() => isAdmin ? setView('admin') : setShowPasscodeModal(true)} className="bg-emerald-50 text-emerald-900 px-2 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-100 shadow-sm active:scale-95 transition-all"><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{isAdmin ? 'Dash' : 'Log In'}</span></button>
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <header className="text-center mb-12 animate-in fade-in duration-1000">
          <h1 className="text-4xl md:text-7xl font-serif text-emerald-900 mb-2 italic tracking-tight">{siteContent.mainTitle}</h1>
          <p className="text-[#C5A021] font-bold tracking-[0.25em] text-[10px] md:text-sm mb-6 uppercase">{siteContent.subTitle}</p>
          <div className="max-w-xs md:max-w-4xl mx-auto border-y border-emerald-900/5 py-6"><p className="text-emerald-800 font-serif italic opacity-75 leading-relaxed text-[13px] md:text-[20px]">“{siteContent.verse}”</p></div>
        </header>

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-in duration-500">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-fit">
              <div className="bg-emerald-900 p-4"><h2 className="text-lg md:text-xl font-serif text-white italic tracking-tight leading-none">The 4 Spiritual Pillars</h2></div>
              <div className="divide-y divide-slate-50">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="p-4 hover:bg-slate-50 transition-all">
                    <h4 className="font-bold uppercase text-[9px] text-emerald-900 mb-1 tracking-widest opacity-40 italic">{siteContent?.[`pillar${n}Title`] || `Pillar ${n}`}</h4>
                    <p className="text-slate-600 text-[11px] md:text-sm leading-relaxed font-medium tracking-tight">{siteContent?.[`pillar${n}Desc`]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {visionActs.map(act => (
                <div key={act.id} className="bg-white p-5 md:p-6 rounded-xl border border-slate-100 border-l-[6px] border-emerald-900 shadow-sm">
                  <h3 className="font-serif text-lg italic text-emerald-900 tracking-tight mb-1">{act.title}</h3>
                  <p className="text-[11px] md:text-sm text-gray-500 leading-relaxed font-medium tracking-tight whitespace-pre-line">{act.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'floor' && (
          <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="font-bold text-emerald-900 uppercase text-[10px] tracking-widest italic opacity-40">{siteContent.mapHeader || 'Hall Layout Architect'}</h3>
              <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-8 py-2 rounded-xl text-[10px] font-bold uppercase shadow-lg active:scale-95 transition-all">{isBanquet ? 'To Service' : 'To Banquet'}</button>
            </div>
            <div className="flex justify-between items-center bg-white border border-gray-100 rounded-xl p-3 mb-8 shadow-sm overflow-x-auto no-scrollbar gap-8">
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-2.5 border border-black bg-white" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendRooms || 'Rooms'}</span></div>
              <div className="flex items-center gap-1.5"><div className="flex gap-0.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /></div><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendSeating || 'Seating'}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-md" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendEntry || 'Circle'}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3.5 h-2.5 bg-orange-400 border border-orange-600 rounded-sm" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendBanquet || 'Tables'}</span></div>
            </div>
            <MapRenderer mode={isBanquet ? 'banquet' : 'service'} />
          </div>
        )}

        {activeTab === 'program' && (
          <div className="space-y-6 animate-in duration-700 max-w-4xl mx-auto">
            <div className="flex bg-emerald-900/5 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar shadow-inner">
              {masterEvents.map(ev => (<button key={ev.id} onClick={() => setActiveEventSubTab(ev.id)} className={`flex-1 py-2 px-6 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${activeEventSubTab === ev.id ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}>{ev.name}</button>))}
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-emerald-900 text-white text-center"><h3 className="font-serif text-lg italic tracking-tight">{masterEvents.find(e => e.id === activeEventSubTab)?.programHeader || 'Itinerary'}</h3></div>
              <div className="divide-y divide-slate-50">
                {program.filter(item => item.parentId === activeEventSubTab).map(row => (
                  <div key={row.id}>
                    <div onClick={() => setActiveProgramId(activeProgramId === row.id ? null : row.id)} className="flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-all">
                      <div className="w-16 md:w-24 font-bold text-[10px] text-emerald-800 uppercase tracking-tighter shrink-0">{row.time}</div>
                      <div className="flex-1">
                        <div className="font-bold text-[11px] md:text-sm text-slate-700 leading-tight tracking-tight">{row.activity}</div>
                        {row.remarks && <div className="text-[9px] text-emerald-600 italic font-semibold">— {row.remarks}</div>}
                      </div>
                    </div>
                    {activeProgramId === row.id && row.description && (
                      <div className="px-4 pb-4 bg-slate-50/50 text-[10px] text-slate-500 pl-20 md:pl-28 animate-in fade-in leading-relaxed font-medium">{row.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logisticsCards.filter(c => c.parentId === activeEventSubTab).map(card => (
                <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-100 border-t-[4px] border-[#C5A021] shadow-sm">
                  <h4 className="font-bold text-emerald-900 uppercase text-[9px] mb-2 tracking-widest italic opacity-40">{card.title}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium whitespace-pre-line tracking-tight">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-700 items-start">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-fit">
              <div className="bg-emerald-900 p-4"><h3 className="font-serif italic text-white text-lg tracking-tight leading-none">{siteContent?.cateringHeader || 'Catering Information'}</h3></div>
              <div className="divide-y divide-slate-50">
                {catering.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-all">
                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{item.group}</span>
                    <span className="text-[11px] md:text-[13px] font-bold text-emerald-900 tracking-tight">{item.dish}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {logisticsCards.filter(card => !card.parentId).map(card => (
                <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-100 border-l-[6px] border-emerald-900 shadow-sm hover:shadow-md transition-all duration-500">
                  <h4 className="font-black text-emerald-900 uppercase text-[9px] mb-2 tracking-widest italic opacity-40">{card.title}</h4>
                  <p className="text-[11px] md:text-sm text-slate-600 leading-relaxed font-bold tracking-tight whitespace-pre-line">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-4 animate-in duration-700 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-end mb-1"><h3 className="font-black text-emerald-900 text-[9px] uppercase tracking-widest italic opacity-40">Event Readiness</h3><span className="font-serif italic text-emerald-900 text-3xl tracking-tighter">{Math.round((committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100)}%</span></div>
              <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border shadow-inner"><div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${(committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {committees.map((comm) => (
                <div key={comm.id} className="bg-white p-5 rounded-xl border border-slate-100 border-t-4 border-emerald-900 shadow-sm group hover:shadow-md transition-all duration-500">
                  <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-tighter mb-4">{comm.title}</h3>
                  <div className="space-y-2">
                    {comm.tasks?.map((t, i) => {
                      const overdue = !t.completed && isOverdue(t.dueDate);
                      return (
                        <div key={i} className={`p-3 rounded-lg border border-slate-50 transition-all duration-500 ${t.completed ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm'}`}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" className="mt-0.5 accent-emerald-600 w-3.5 h-3.5 rounded" checked={t.completed || false} onChange={async () => { const nt = [...comm.tasks]; nt[i].completed = !nt[i].completed; await updateField('committees', comm.id, { tasks: nt }); }} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[10px] md:text-[11px] block font-bold tracking-tight ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.text}</span>
                              <div className="flex gap-2 mt-1 opacity-60">
                                 {t.dueDate && <span className={`text-[7px] font-black uppercase px-1 rounded ${overdue ? 'bg-red-50 text-red-600' : 'bg-slate-100'}`}>Due: {t.dueDate}</span>}
                                 {t.assignee && <span className="text-[7px] font-black uppercase bg-emerald-50 text-emerald-800 px-1 rounded">@{t.assignee}</span>}
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-40 border-t border-slate-100 pt-20 pb-16 text-center opacity-10 hover:opacity-50 transition-all duration-1000 grayscale hover:grayscale-0">
          <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="Logo" className="w-12 mx-auto mb-8" />
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-900 italic">Established 2014</p>
        </footer>

        {showPasscodeModal && (
          <div className="fixed inset-0 z-[1000] bg-emerald-950/95 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white p-12 rounded-2xl w-full max-w-xs text-center shadow-2xl scale-95 animate-in zoom-in-95 shadow-emerald-900/20">
              <form onSubmit={handlePasscode} className="space-y-10">
                <h2 className="font-serif text-3xl italic text-emerald-900 tracking-tight leading-none">Master Access</h2>
                <input type="password" autoFocus className="w-full text-center text-4xl p-5 bg-slate-50 rounded-2xl border-none outline-none font-black tracking-widest focus:ring-2 ring-emerald-500 transition-all shadow-inner" onChange={(e) => setPasscodeInput(e.target.value)} />
                <button type="submit" className="w-full bg-emerald-900 text-white p-5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all hover:bg-emerald-800">Verify Identity</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}