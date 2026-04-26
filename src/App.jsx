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
  const [activeProgramId, setActiveProgramId] = useState(null); const [isBanquet, setIsBanquet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setIsAdmin(false);
      setView('public');
      localStorage.removeItem('gsm_admin');
    }
  };

  const SECRET_CODE = 'GSM2026';

  const [program, setProgram] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [catering, setCatering] = useState([]);
  const [logisticsCards, setLogisticsCards] = useState([]);
  const [visionActs, setVisionActs] = useState(() => {
    const saved = localStorage.getItem('gsm_vision_cache');
    return saved ? JSON.parse(saved) : [];
  });
  const [mapObjects, setMapObjects] = useState([]);
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);
    onSnapshot(doc(db, 'site', 'content'), (snap) => snap.exists() && setSiteContent(prev => ({ ...prev, ...snap.data() })));
    onSnapshot(query(collection(db, 'program'), orderBy('time')), (snap) => setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'committees'), (snap) => setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'catering'), (snap) => setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'logisticsCards'), (snap) => setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
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

  const MapRenderer = ({ mode }) => {
    return (
      /* We reduced the max-width and changed the aspect ratio to make it shorter */
      <div className="relative w-full aspect-[1.8/1] md:aspect-[2.2/1] border-[3px] border-[#2D2D2D] bg-white overflow-hidden rounded-lg shadow-lg mx-auto max-w-[700px]">
        {mapObjects.filter(obj => mode === 'banquet' ? obj.showInBanquet : obj.showInService).map(obj => (
          <div
            key={obj.id}
            onDoubleClick={() => {
              setAdminActiveTab('floor');
              setTimeout(() => { document.getElementById(`edit-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
            }}
            className={`absolute flex items-center justify-center transition-all cursor-pointer ${obj.type === 'room' ? 'border border-black bg-black/5 font-bold uppercase' :
              obj.type === 'block' ? 'bg-emerald-100/10 border border-emerald-900/10' :
                obj.type === 'icon' ? 'bg-blue-500 rounded-full border border-white shadow-sm' :
                  'bg-orange-400 border border-orange-600 shadow-sm'
              }`}
            style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%`, zIndex: obj.z || 10 }}
          >
            {obj.label && (
              <span className="pointer-events-none px-0.5 text-center leading-none z-50 text-black text-[5px] md:text-[8px] font-black tracking-tighter">
                {obj.label}
              </span>
            )}

            {obj.type === 'block' && (
              <div className="absolute inset-0 p-1 gap-1 grid" style={{ gridTemplateColumns: `repeat(${obj.cols || 4}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${obj.rows || 6}, minmax(0, 1fr))` }}>
                {Array.from({ length: (obj.rows || 6) * (obj.cols || 4) }).map((_, i) => (
                  <div key={i} className="w-0.5 h-0.5 md:w-1 md:h-1 bg-emerald-600 rounded-full opacity-40 mx-auto" />
                ))}
              </div>
            )}
          </div>
        ))}
        {/* Subtle watermarks for hall labels */}
        <div className="absolute font-black text-[8px] uppercase opacity-5 text-emerald-900 pointer-events-none" style={{ top: '40%', left: '38%' }}>Main Hall</div>
        <div className="absolute font-black text-[8px] uppercase opacity-5 text-emerald-900 rotate-90 pointer-events-none" style={{ top: '35%', left: '76%' }}>Front Hall</div>
      </div>
    );
  };

  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === SECRET_CODE) { setIsAdmin(true); setView('admin'); setAdminActiveTab('settings'); setShowPasscodeModal(false); localStorage.setItem('gsm_admin', 'true'); }
    else alert('Invalid Code');
  };

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-white border-b p-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-serif italic font-bold text-emerald-900 text-xl">GSM Master Backend</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Return to Site Button */}
            <button
              onClick={() => setView('public')}
              className="text-[9px] md:text-[10px] font-bold uppercase px-4 md:px-6 py-2 border border-emerald-900 text-emerald-900 rounded-full hover:bg-emerald-50 transition-all"
            >
              View Site
            </button>

            {/* New Logout Button */}
            <button
              onClick={handleLogout}
              className="text-[9px] md:text-[10px] font-bold uppercase px-4 md:px-6 py-2 bg-red-50 text-red-600 rounded-full border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {['settings', 'vision', 'floor', 'program', 'logistics', 'committees'].map(t => (
              <button
                key={t}
                onClick={() => setAdminActiveTab(t)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${adminActiveTab === t ? 'bg-emerald-900 text-white shadow-md' : 'bg-white text-slate-400 border'
                  }`}
              >
                {t === 'floor' ? 'Floor' : t.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="bg-white p-6 md:p-10 rounded-3xl border shadow-sm min-h-[600px]">
            {adminActiveTab === 'settings' && (
              <div className="space-y-8 max-w-2xl">
                <h3 className="font-bold text-emerald-900 text-[10px] uppercase border-b pb-2 tracking-widest italic">Branding Architect</h3>
                <div className="grid grid-cols-1 gap-6 bg-slate-50 p-6 rounded-3xl border shadow-inner">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Main Title</label><input className="w-full p-3 border rounded-xl mt-1 text-sm font-serif italic outline-none" defaultValue={siteContent?.mainTitle} onBlur={(e) => updateSite({ mainTitle: e.target.value })} /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Subtitle</label><input className="w-full p-3 border rounded-xl mt-1 text-[11px] font-bold tracking-[0.2em] outline-none" defaultValue={siteContent?.subTitle} onBlur={(e) => updateSite({ subTitle: e.target.value })} /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase">Verse</label><textarea className="w-full p-3 border rounded-xl mt-1 h-28 text-xs font-serif italic outline-none" defaultValue={siteContent?.verse} onBlur={(e) => updateSite({ verse: e.target.value })} /></div>
                </div>
              </div>
            )}
            {adminActiveTab === 'floor' && (
              <div className="space-y-8">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase italic tracking-widest">Map Labels Architect</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div><label className="text-[8px] font-black uppercase text-slate-400">Map Version</label><input className="w-full p-2 text-xs border rounded-lg mt-1" defaultValue={siteContent?.mapHeader} onBlur={(e) => updateSite({ mapHeader: e.target.value })} /></div>
                    <div><label className="text-[8px] font-black uppercase text-slate-400">Box Label</label><input className="w-full p-2 text-xs border rounded-lg mt-1" defaultValue={siteContent?.legendRooms} onBlur={(e) => updateSite({ legendRooms: e.target.value })} /></div>
                    <div><label className="text-[8px] font-black uppercase text-slate-400">Dot Label</label><input className="w-full p-2 text-xs border rounded-lg mt-1" defaultValue={siteContent?.legendSeating} onBlur={(e) => updateSite({ legendSeating: e.target.value })} /></div>
                    <div><label className="text-[8px] font-black uppercase text-slate-400">Circle Label</label><input className="w-full p-2 text-xs border rounded-lg mt-1" defaultValue={siteContent?.legendEntry} onBlur={(e) => updateSite({ legendEntry: e.target.value })} /></div>
                    <div><label className="text-[8px] font-black uppercase text-slate-400">Table Label</label><input className="w-full p-2 text-xs border rounded-lg mt-1" defaultValue={siteContent?.legendBanquet} onBlur={(e) => updateSite({ legendBanquet: e.target.value })} /></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2"><MapRenderer mode={isBanquet ? 'banquet' : 'service'} /></div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    <button onClick={() => addItem('mapObjects', { type: 'room', label: 'New Object', x: 20, y: 20, w: 15, h: 15, showInService: true, showInBanquet: true })} className="w-full py-4 bg-emerald-900 text-white rounded-xl font-bold text-[10px] uppercase">+ CREATE OBJECT</button>
                    {mapObjects.map(obj => (
                      <div key={obj.id} id={`edit-${obj.id}`} className="p-4 bg-white rounded-xl border space-y-2">
                        <div className="flex justify-between items-center"><select className="text-[9px] font-bold" value={obj.type} onChange={(e) => updateField('mapObjects', obj.id, { type: e.target.value })}><option value="room">Room</option><option value="block">Seating</option><option value="icon">Icon</option></select><button onClick={() => removeItem('mapObjects', obj.id, 'object')} className="text-red-300">×</button></div>
                        <input className="w-full p-1 text-[10px] border rounded font-bold" value={obj.label} onChange={(e) => updateField('mapObjects', obj.id, { label: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {adminActiveTab === 'vision' && (
              <div className="space-y-10">
                <div className="bg-emerald-900 p-6 rounded-3xl border text-white space-y-6">
                  <h3 className="font-bold text-[#C5A021] text-[10px] uppercase tracking-[0.2em]">The 4 Spiritual Pillars</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800 space-y-2">
                        <label className="text-[8px] font-black text-[#C5A021] uppercase">Title {num}</label>
                        <input className="w-full bg-transparent border-b border-emerald-700 text-xs font-bold" defaultValue={siteContent?.[`pillar${num}Title`]} onBlur={(e) => updateSite({ [`pillar${num}Title`]: e.target.value })} />
                        <label className="text-[8px] font-black text-[#C5A021] uppercase block mt-2">Description {num}</label>
                        <textarea className="w-full bg-transparent border border-emerald-800 text-[10px] rounded h-16" defaultValue={siteContent?.[`pillar${num}Desc`]} onBlur={(e) => updateSite({ [`pillar${num}Desc`]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-emerald-900 text-xs uppercase">Vision Acts</h3><button onClick={() => addItem('visionActs', { title: 'New Act', desc: '...' })} className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-4 py-2 rounded-full">+ ADD ACT</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visionActs.map(act => (
                      <div key={act.id} className="p-4 bg-slate-50 rounded-2xl relative border">
                        <button onClick={() => removeItem('visionActs', act.id, 'act')} className="absolute top-3 right-3 text-red-200">×</button>
                        <input className="font-bold text-emerald-900 text-xs w-full bg-transparent border-b border-dashed mb-2" defaultValue={act.title} onBlur={(e) => updateField('visionActs', act.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] p-2 rounded-xl border h-20" defaultValue={act.desc} onBlur={(e) => updateField('visionActs', act.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {adminActiveTab === 'program' && (
              <div className="space-y-10">
                <div className="bg-slate-50 p-4 rounded-3xl border shadow-inner">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">Program Overview</h3>
                    <button onClick={() => addItem('program', { time: '00:00', activity: 'New Segment', remarks: '', description: '' })} className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-4 py-1.5 rounded-full">+ ADD SLOT</button>
                  </div>

                  <div className="space-y-3">
                    {program.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-2xl border shadow-sm space-y-3 relative group">
                        <button onClick={() => removeItem('program', item.id, 'slot')} className="absolute top-2 right-2 text-red-200 hover:text-red-400">×</button>

                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-4 md:col-span-2">
                            <label className="text-[7px] font-black text-slate-300 uppercase">Time</label>
                            <input className="w-full p-1.5 text-[10px] font-bold border rounded-lg bg-slate-50" defaultValue={item.time} onBlur={(e) => updateField('program', item.id, { time: e.target.value })} />
                          </div>
                          <div className="col-span-8 md:col-span-10">
                            <label className="text-[7px] font-black text-slate-300 uppercase">Activity Name</label>
                            <input className="w-full p-1.5 text-[10px] font-bold border rounded-lg" defaultValue={item.activity} onBlur={(e) => updateField('program', item.id, { activity: e.target.value })} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[7px] font-black text-slate-300 uppercase">In-Charge / Remarks</label>
                            <input className="w-full p-1.5 text-[10px] border rounded-lg italic" placeholder="Who is leading this?" defaultValue={item.remarks} onBlur={(e) => updateField('program', item.id, { remarks: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[7px] font-black text-slate-300 uppercase">Full Description (Expandable)</label>
                            <textarea className="w-full p-1.5 text-[10px] border rounded-lg h-12" placeholder="Add details for the expanded view..." defaultValue={item.description} onBlur={(e) => updateField('program', item.id, { description: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NEW: Program Cards Admin Section */}
                <div className="bg-slate-50 p-4 rounded-3xl border border-l-8 border-[#C5A021]">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">Program Notes Cards</h3>
                    <button onClick={() => addItem('logisticsCards', { title: 'New Note', desc: '', category: 'program' })} className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-4 py-1.5 rounded-full">+ ADD NOTE CARD</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {logisticsCards.filter(c => c.category === 'program').map(card => (
                      <div key={card.id} className="p-3 bg-white border rounded-2xl relative shadow-sm">
                        <button onClick={() => removeItem('logisticsCards', card.id, 'card')} className="absolute top-2 right-2 text-red-200">×</button>
                        <input className="font-bold uppercase text-[10px] text-emerald-900 w-full mb-2 border-b border-dashed outline-none" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl h-24" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {adminActiveTab === 'committees' && (
              <div className="space-y-8">
                <button onClick={() => addItem('committees', { title: 'New Dept', team: 'TBD', tasks: [] })} className="w-full border-2 border-dashed p-6 text-slate-400 rounded-2xl uppercase font-bold text-[10px]">+ ADD DEPARTMENT</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {committees.map(comm => (
                    <div key={comm.id} className="p-6 bg-slate-50 rounded-2xl border relative space-y-4">
                      <button onClick={() => removeItem('committees', comm.id, 'committee')} className="absolute top-4 right-4 text-red-300">×</button>
                      <input className="font-bold uppercase text-xs w-full bg-transparent border-b border-dashed" defaultValue={comm.title} onBlur={(e) => updateField('committees', comm.id, { title: e.target.value })} />
                      {comm.tasks?.map((t, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border space-y-2">
                          <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-300 uppercase">Task {i + 1}</span><button className="text-red-300 text-[10px]" onClick={async () => { if (window.confirm('Delete?')) { const ts = comm.tasks.filter((_, idx) => idx !== i); await updateField('committees', comm.id, { tasks: ts }); } }}>Remove</button></div>
                          <textarea className="w-full text-[11px] p-1 border-b outline-none" defaultValue={t.text || t} onBlur={(e) => { let ts = [...comm.tasks]; if (typeof ts[i] === 'string') ts[i] = { text: e.target.value, completed: false }; else ts[i].text = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} />
                          <div className="grid grid-cols-2 gap-2"><input type="date" className="text-[10px] p-1 border rounded" defaultValue={t.dueDate} onChange={(e) => { let ts = [...comm.tasks]; ts[i].dueDate = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /><input type="text" className="text-[10px] p-1 border rounded" placeholder="Assignee" defaultValue={t.assignee} onBlur={(e) => { let ts = [...comm.tasks]; ts[i].assignee = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /></div>
                        </div>
                      ))}
                      <button className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-bold" onClick={async () => { const ts = [...(comm.tasks || []), { text: 'New Task', completed: false, dueDate: '', assignee: '' }]; await updateField('committees', comm.id, { tasks: ts }); }}>+ Add Task</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adminActiveTab === 'logistics' && (
              <div className="space-y-12">
                <div className="bg-slate-50 p-3 md:p-8 rounded-3xl border shadow-inner space-y-4">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Catering Title</label>
                  <input className="w-full p-2 md:p-3 border rounded-xl font-serif italic text-xs md:text-base" defaultValue={siteContent?.cateringHeader} onBlur={(e) => updateSite({ cateringHeader: e.target.value })} />
                  <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-emerald-900 text-[9px] uppercase">Catering Matrix</h3><button onClick={() => addItem('catering', { group: 'Group', dish: 'Dish' })} className="text-emerald-700 font-bold text-[8px] bg-emerald-50 px-3 py-1.5 rounded-full">+ ADD GROUP</button></div>
                    {catering.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 border-b pb-3 items-end relative">
                        <div className="col-span-11 md:col-span-4"><label className="text-[7px] font-black text-slate-300">Group</label><input className="font-bold text-[10px] uppercase w-full p-1.5 border rounded-lg bg-slate-50/50" defaultValue={item.group} onBlur={(e) => updateField('catering', item.id, { group: e.target.value })} /></div>
                        <div className="col-span-11 md:col-span-7"><label className="text-[7px] font-black text-slate-300">Menu</label><input className="text-[10px] w-full p-1.5 border rounded-lg" defaultValue={item.dish} onBlur={(e) => updateField('catering', item.id, { dish: e.target.value })} /></div>
                        <div className="col-span-1 flex items-center justify-center pb-1"><button onClick={() => removeItem('catering', item.id, 'item')} className="text-red-300 text-lg">×</button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 md:p-8 rounded-3xl border border-l-8 border-slate-400">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-emerald-900 text-[9px] uppercase">Info Cards</h3><button onClick={() => addItem('logisticsCards', { title: 'New', desc: '' })} className="text-emerald-700 font-bold text-[8px] bg-emerald-50 px-3 py-1.5 rounded-full">+ ADD CARD</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {logisticsCards.map(card => (
                      <div key={card.id} className="p-3 bg-white border rounded-2xl relative shadow-sm">
                        <button onClick={() => removeItem('logisticsCards', card.id, 'card')} className="absolute top-2 right-2 text-red-200">×</button>
                        <input className="font-bold uppercase text-[10px] text-emerald-900 w-full mb-2 border-b border-dashed outline-none" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl h-20" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
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
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D]">
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-3 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        {/* Left: Branding */}
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter w-[20%]">
          GSM <span className="font-light italic text-[#C5A021] hidden md:inline">12th Anniversary</span>
        </div>

        {/* Center: Tabs */}
        <div className="flex justify-center items-center flex-1 gap-1 md:gap-6">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-[7px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] border-b-2 py-1 whitespace-nowrap transition-all ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'
                }`}
            >
              {t === 'checklist' ? 'Committees' : t}
            </button>
          ))}
        </div>

        {/* Right: Icon-based Access */}
        <div className="w-[20%] flex justify-end">
          <button
            onClick={() => isAdmin ? setView('admin') : setShowPasscodeModal(true)}
            className="bg-emerald-50 text-emerald-900 px-2 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-100 active:scale-95 transition-all shadow-sm"
          >
            {isAdmin ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Dash</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Log In</span>
              </>
            )}
          </button>
        </div>
      </nav>
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <header className="text-center mb-8 md:mb-12 px-4 animate-in fade-in duration-700">
          <h1 className="text-4xl md:text-7xl font-serif text-emerald-900 mb-2 italic tracking-tight">{siteContent.mainTitle}</h1>
          <p className="text-[#C5A021] font-bold tracking-[0.25em] text-[10px] md:text-sm mb-4 uppercase">{siteContent.subTitle}</p>
          <div className="max-w-xs md:max-w-4xl mx-auto"><p className="text-emerald-800 font-serif italic opacity-75 leading-relaxed text-[12px] md:text-[20px] md:line-clamp-2 overflow-hidden">{siteContent.verse}</p></div>
        </header>

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-in duration-500">
            <div className="bg-emerald-900 text-white p-6 md:p-10 rounded-3xl shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-serif mb-6 text-[#C5A021]">The 4 Spiritual Pillars</h2>
              <div className="space-y-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="border-l-2 border-[#C5A021] pl-4"><h4 className="font-bold uppercase text-[10px] text-[#C5A021] mb-1">{siteContent?.[`pillar${n}Title`] || `Pillar ${n}`}</h4><p className="text-gray-300 text-[11px] md:text-sm leading-relaxed">{siteContent?.[`pillar${n}Desc`]}</p></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {visionActs.map(act => (
                <div key={act.id} className="bg-white p-5 md:p-8 rounded-2xl border shadow-sm border-l-[6px] border-emerald-900"><h3 className="font-serif text-lg md:text-xl mb-1 italic text-emerald-900">{act.title}</h3><p className="text-[11px] md:text-sm text-gray-600 leading-relaxed">{act.desc}</p></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'floor' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="font-bold text-emerald-900 uppercase text-[10px] tracking-widest italic">
                {siteContent.mapHeader || 'Floor Plan Architect v5.1'}
              </h3>
              <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase shadow-md active:scale-95 transition-all">
                {isBanquet ? 'To Service' : 'To Banquet'}
              </button>
            </div>

            {/* MINIMALIST ONE-LINE LEGEND */}
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-xl p-3 mb-6 border border-gray-100">
              {/* Rooms */}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 border border-black bg-white" />
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900 tracking-tighter">
                  {siteContent.legendRooms || 'Rooms'}
                </span>
              </div>

              {/* Chairs */}
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900 tracking-tighter">
                  {siteContent.legendSeating || 'Chairs'}
                </span>
              </div>

              {/* Box */}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-sm" />
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900 tracking-tighter">
                  {siteContent.legendEntry || 'Box'}
                </span>
              </div>

              {/* Tables */}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-2.5 bg-orange-400 border border-orange-600" />
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900 tracking-tighter">
                  {siteContent.legendBanquet || 'Tables'}
                </span>
              </div>
            </div>

            <MapRenderer mode={isBanquet ? 'banquet' : 'service'} />
          </div>
        )}

        {activeTab === 'program' && (
          <div className="space-y-6 animate-in">
            <div className="bg-white rounded-2xl md:rounded-3xl border shadow-xl overflow-hidden">
              <div className="p-4 md:p-6 bg-emerald-900 text-white flex justify-between items-center">
                <h3 className="font-serif text-lg md:text-xl italic">{siteContent.programHeader}</h3>
                <span className="text-[8px] uppercase tracking-widest opacity-60">Tap for details</span>
              </div>

              <div className="divide-y divide-gray-100">
                {program.map((row, i) => {
                  const isExpanded = activeProgramId === row.id;
                  return (
                    <div key={i} className="transition-all">
                      {/* Main Row */}
                      <div
                        onClick={() => setActiveProgramId(isExpanded ? null : row.id)}
                        className={`flex items-start md:items-center p-3 md:p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-emerald-50/40' : ''}`}
                      >
                        {/* Time Column */}
                        <div className="w-14 md:w-24 shrink-0 font-bold text-[10px] md:text-xs text-emerald-800 pt-0.5 md:pt-0">
                          {row.time}
                        </div>

                        {/* Activity & Remarks Column */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-[11px] md:text-sm text-slate-700 leading-tight">
                            {row.activity}
                          </div>
                          {/* REMARKS RESTORED HERE: Visible immediately under the title */}
                          {row.remarks && (
                            <div className="text-[9px] md:text-[11px] text-emerald-700 font-medium italic mt-0.5">
                              {row.remarks}
                            </div>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <div className={`shrink-0 transition-transform duration-300 mt-1 md:mt-0 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                      </div>

                      {/* Expandable Description only */}
                      {isExpanded && row.description && (
                        <div className="px-4 pb-4 bg-emerald-50/40 animate-in slide-in-from-top-1">
                          <div className="pl-14 md:pl-24">
                            <div className="h-[1px] bg-emerald-100 mb-3 w-12" />
                            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed max-w-xl">
                              {row.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Host/Note Cards stay at the bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logisticsCards.filter(c => c.category === 'program').map(card => (
                <div key={card.id} className="bg-white p-5 rounded-2xl border shadow-sm border-t-4 border-[#C5A021]">
                  <h4 className="font-bold text-emerald-900 uppercase text-[9px] mb-2 tracking-widest">{card.title}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in">
            {/* Catering Section stays the same */}
            <div className="bg-white p-6 md:p-10 rounded-2xl border shadow-sm border-t-8 border-emerald-900">
              <h3 className="font-serif text-2xl md:text-3xl text-emerald-900 mb-6 italic underline decoration-[#C5A021]">{siteContent.cateringHeader}</h3>
              <div className="space-y-1">{catering.map((item, i) => (<div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 gap-4"><span className="font-medium text-[11px] md:text-sm text-gray-700 uppercase">{item.group}</span><span className="font-bold text-[11px] md:text-sm text-orange-800">{item.dish}</span></div>))}</div>
            </div>

            {/* UPDATED: Logistics Cards with Filter */}
            <div className="flex flex-col gap-4">
              {logisticsCards
                .filter(card => card.category !== 'program') // <--- ADD THIS LINE
                .map(card => (
                  <div key={card.id} className={`bg-white p-6 md:p-8 rounded-2xl border shadow-sm border-l-[6px] ${card.color || 'border-emerald-800'}`}>
                    <h4 className="font-bold text-emerald-900 uppercase text-[9px] mb-2">{card.title}</h4>
                    <p className="text-[11px] md:text-sm leading-relaxed text-gray-600 whitespace-pre-line">{card.desc}</p>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-8 animate-in">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="flex justify-between items-end mb-2"><h3 className="font-black text-emerald-900 text-[10px] uppercase tracking-widest">Event Readiness</h3><span className="font-serif italic text-emerald-900 text-lg">{Math.round((committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100)}%</span></div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border"><div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${(committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {committees.map((comm) => (
                <div key={comm.id} className={`bg-white p-6 rounded-3xl border-t-8 ${comm.color || 'border-emerald-900'} shadow-md`}>
                  <div className="mb-4"><h3 className="font-bold text-emerald-900 text-sm uppercase leading-tight">{comm.title}</h3><p className="text-[10px] text-gray-400 font-bold uppercase">{comm.team}</p></div>
                  <div className="space-y-3">
                    {comm.tasks?.map((t, i) => {
                      const overdue = !t.completed && isOverdue(t.dueDate);
                      return (
                        <div key={i} className={`group p-3 rounded-xl border transition-all ${t.completed ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-emerald-200'}`}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" className="mt-1 accent-emerald-600" checked={t.completed || false} onChange={async () => { const newTasks = [...comm.tasks]; newTasks[i] = typeof newTasks[i] === 'string' ? { text: newTasks[i], completed: true } : { ...newTasks[i], completed: !newTasks[i].completed }; await updateField('committees', comm.id, { tasks: newTasks }); }} />
                            <div className="flex-1">
                              <span className={`text-[11px] md:text-xs block mb-1 ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.text || t}</span>
                              <div className="flex flex-wrap gap-1">
                                {t.dueDate && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${overdue ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{overdue ? 'Overdue' : `Due: ${new Date(t.dueDate).toLocaleDateString()}`}</span>}
                                {t.assignee && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase">@{t.assignee}</span>}
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
        <footer className="mt-20 border-t pt-10 pb-10 text-center">
          <div className="opacity-20 grayscale hover:opacity-50 transition-opacity">
            <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="GSM" className="w-8 mx-auto" />
          </div>
        </footer>
        {showPasscodeModal && (
          <div className="fixed inset-0 z-[1000] bg-emerald-900/95 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl w-full max-w-xs shadow-2xl text-center">
              <form onSubmit={handlePasscode} className="space-y-4">
                <h2 className="font-serif text-2xl mb-4 italic text-emerald-900">Backend Access</h2>
                <input type="password" autoFocus className="w-full text-center text-2xl p-4 bg-gray-50 rounded-xl border outline-none font-bold" onChange={(e) => setPasscodeInput(e.target.value)} />
                <button className="w-full bg-emerald-900 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg">Login</button>
                <button type="button" onClick={() => setShowPasscodeModal(false)} className="text-gray-400 text-[10px] font-bold uppercase mt-4">Cancel</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}