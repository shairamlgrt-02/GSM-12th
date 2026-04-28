import React, { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, LogIn, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, GripVertical, Plus } from 'lucide-react'; import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, addDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

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
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const [visionActs, setVisionActs] = useState(() => {
    const saved = localStorage.getItem('gsm_vision_cache');
    return saved ? JSON.parse(saved) : [];
  });

  const SECRET_CODE = 'GSM2026';

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);

    onSnapshot(doc(db, 'site', 'content'), (snap) => snap.exists() && setSiteContent(snap.data()));
    onSnapshot(query(collection(db, 'program'), orderBy('order', 'asc')), (snap) => {
      setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'committees'), (snap) => setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'catering'), (snap) => setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'logisticsCards'), (snap) => setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // Listens to masterEvents (Check your Firestore collection name matches this exactly)
    onSnapshot(query(collection(db, 'masterEvents'), orderBy('rank', 'asc')), (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMasterEvents(events);

      const visibleEvents = events.filter(e => e.isActive !== false);
      if (visibleEvents.length > 0 && !activeEventSubTab) setActiveEventSubTab(visibleEvents[0].id);
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

  const addItem = async (col, data) => {
    if (col === 'masterEvents') {
      const newRank = masterEvents.length > 0 ? Math.max(...masterEvents.map(e => e.rank || 0)) + 1 : 0;
      await addDoc(collection(db, col), { ...data, rank: newRank, isActive: true });
    } else {
      await addDoc(collection(db, col), data);
    }
  };

  const insertItemAt = async (parentId, targetOrder) => {
    const eventItems = program.filter(p => p.parentId === parentId).sort((a, b) => a.order - b.order);
    const batch = writeBatch(db);
    eventItems.forEach(item => {
      if (item.order >= targetOrder) batch.update(doc(db, 'program', item.id), { order: item.order + 1 });
    });
    const newDocRef = doc(collection(db, 'program'));
    batch.set(newDocRef, { parentId, time: '00:00', activity: '', remarks: '', description: '', order: targetOrder });
    await batch.commit();
  };

  const onDragStart = (index) => setDraggedItemIndex(index);
  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === index) return;
    const eventItems = program.filter(p => p.parentId === activeEventId).sort((a, b) => a.order - b.order);
    const newList = [...eventItems];
    const draggedItem = newList[draggedItemIndex];
    newList.splice(draggedItemIndex, 1);
    newList.splice(index, 0, draggedItem);
    const batch = writeBatch(db);
    newList.forEach((item, idx) => batch.update(doc(db, 'program', item.id), { order: idx }));
    batch.commit();
    setDraggedItemIndex(index);
  };

  const removeItem = async (col, id, label) => {
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) {
      await deleteDoc(doc(db, col, id));
      if (col === 'masterEvents') {
        const progSnaps = await getDocs(query(collection(db, 'program'), orderBy('time')));
        progSnaps.docs.forEach(async (d) => {
          if (d.data().parentId === id) await deleteDoc(d.ref);
        });
      }
    }
  };

  const moveRank = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= masterEvents.length) return;

    const batch = writeBatch(db);
    const current = masterEvents[index];
    const target = masterEvents[targetIndex];

    batch.update(doc(db, 'masterEvents', current.id), { rank: target.rank ?? targetIndex });
    batch.update(doc(db, 'masterEvents', target.id), { rank: current.rank ?? index });

    await batch.commit();
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
          <div className="font-serif italic font-bold text-emerald-900 text-base md:text-xl flex items-center gap-2">
            <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="Logo" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
            GSM Master Backend
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('public')} className="text-[8px] md:text-[10px] font-bold uppercase px-3 md:px-6 py-2 border border-emerald-900 text-emerald-900 rounded-full hover:bg-emerald-50 transition-all">View Site</button>
            <button onClick={handleLogout} className="text-[8px] md:text-[10px] font-bold uppercase px-3 md:px-6 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">Logout</button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-4 md:p-10">
          <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar justify-start md:justify-center px-2">
            {['settings', 'vision', 'floor', 'program', 'logistics', 'committees'].map(t => (
              <button
                key={t}
                onClick={() => setAdminActiveTab(t)}
                className={`px-5 py-2 rounded-full font-bold uppercase border transition-all whitespace-nowrap flex-shrink-0 ${adminActiveTab === t ? 'bg-emerald-900 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {t === 'program' ? 'Events' : t}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-3xl border shadow-sm min-h-[600px]">
            {adminActiveTab === 'settings' && (
              <div className="space-y-8 max-w-2xl animate-in fade-in">
                <div className="border-b pb-4">
                  <h3 className="font-serif italic text-2xl text-emerald-900 leading-none">Branding Architect</h3>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Core Identity Settings</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Main Title</label>
                    <input className="w-full bg-transparent border-b border-slate-100 p-0 py-1 text-xl font-serif italic text-emerald-900 outline-none focus:border-emerald-900 transition-all" defaultValue={siteContent?.mainTitle} onBlur={(e) => updateSite({ mainTitle: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subtitle</label>
                    <input className="w-full bg-transparent border-b border-slate-100 p-0 py-1 text-[11px] font-bold tracking-[0.2em] outline-none focus:border-emerald-900 transition-all" defaultValue={siteContent?.subTitle} onBlur={(e) => updateSite({ subTitle: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Theme Verse</label>
                    <textarea className="w-full bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 text-xs font-serif italic text-emerald-800 outline-none focus:bg-white focus:border-emerald-900 transition-all h-28 resize-none" defaultValue={siteContent?.verse} onBlur={(e) => updateSite({ verse: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'vision' && (
              <div className="space-y-12 animate-in fade-in">
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="font-serif italic text-2xl text-emerald-900 leading-none">Vision & Pillars</h3>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Spiritual Foundation Architect</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="space-y-2 group">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pillar {num} Title</label>
                        <input className="w-full bg-transparent border-b border-slate-100 p-0 py-1 text-xs font-bold text-emerald-900 outline-none focus:border-emerald-900 transition-all" defaultValue={siteContent?.[`pillar${num}Title`]} onBlur={(e) => updateSite({ [`pillar${num}Title`]: e.target.value })} />
                        <label className="text-[7px] font-black text-slate-300 uppercase block mt-2 tracking-tighter">Description</label>
                        <textarea className="w-full bg-slate-50/50 border border-slate-100 rounded-lg p-2 text-[10px] h-16 outline-none focus:bg-white focus:border-emerald-900 transition-all resize-none" defaultValue={siteContent?.[`pillar${num}Desc`]} onBlur={(e) => updateSite({ [`pillar${num}Desc`]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">Vision Acts</h3>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">Practical Commitments</p>
                    </div>
                    <button onClick={() => addItem('visionActs', { title: '', desc: '' })} className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-4 py-1.5 rounded-full shadow-sm hover:bg-emerald-100 transition-all">+ ADD ACT</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {visionActs.map(act => (
                      <div key={act.id} className="relative group pb-4 border-b border-slate-50">
                        <button onClick={() => removeItem('visionActs', act.id, 'act')} className="absolute top-0 right-0 text-red-200 hover:text-red-400 transition-colors">×</button>
                        <input className="font-bold text-emerald-900 text-[11px] w-full bg-transparent border-none p-0 mb-1 outline-none focus:text-emerald-700" placeholder="ACT TITLE" defaultValue={act.title} onBlur={(e) => updateField('visionActs', act.id, { title: e.target.value })} />
                        <textarea className="w-full text-[10px] bg-transparent p-0 border-none outline-none focus:text-slate-600 h-16 resize-none leading-relaxed" placeholder="Actionable description..." defaultValue={act.desc} onBlur={(e) => updateField('visionActs', act.id, { desc: e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'floor' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="bg-emerald-50/50 p-4 md:p-6 rounded-3xl border border-emerald-100 space-y-4 shadow-inner">
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase italic tracking-widest">MAP LABELS ARCHITECT</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                      <span className="font-bold text-emerald-900 uppercase text-[9px] tracking-widest">MAP: {isBanquet ? 'BANQUET' : 'SERVICE'}</span>
                      <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase shadow-md transition-all active:scale-95">
                        SWITCH MODE
                      </button>
                    </div>
                    <MapRenderer mode={isBanquet ? 'banquet' : 'service'} isAdminView={true} />
                  </div>

                  <div className="lg:col-span-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar lg:border-l lg:pl-4">
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
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Event Name</label>
                      <input id="evNameInput" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 ring-emerald-500" placeholder="e.g. Main Service" />
                    </div>
                    <button onClick={() => {
                      const val = document.getElementById('evNameInput').value;
                      if (val) addItem('masterEvents', { name: val, isActive: true });
                      document.getElementById('evNameInput').value = '';
                    }} className="bg-emerald-900 text-white px-6 py-2 rounded-lg text-[9px] font-black uppercase shadow-sm">Create Event</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-6">
                  {masterEvents.map((ev, index) => (
                    <div key={ev.id} className={`flex items-center bg-white border rounded-lg pl-3 pr-1 py-1 gap-2 shadow-sm transition-all ${activeEventId === ev.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}>
                      <input
                        className={`bg-transparent text-[9px] font-black uppercase outline-none w-24 ${activeEventId === ev.id ? 'text-emerald-900' : 'text-slate-400'}`}
                        defaultValue={ev.name}
                        onBlur={(e) => updateField('masterEvents', ev.id, { name: e.target.value })}
                        onClick={() => setActiveEventId(ev.id)}
                      />
                      <div className="flex border-l border-slate-100 pl-1 gap-0.5">
                        <button onClick={() => moveRank(index, 'up')} className="p-1 hover:text-emerald-600 text-slate-300"><ChevronUp size={12} /></button>
                        <button onClick={() => moveRank(index, 'down')} className="p-1 hover:text-emerald-600 text-slate-300"><ChevronDown size={12} /></button>
                        <button onClick={() => updateField('masterEvents', ev.id, { isActive: !ev.isActive })} className="p-1">
                          {ev.isActive !== false ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-red-300" />}
                        </button>
                        <button onClick={() => removeItem('masterEvents', ev.id, 'event')} className="p-1 text-red-200 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {activeEventId && (
                  <div className="mt-4 border border-slate-200 rounded-lg bg-white pb-4">
                    <div className="grid grid-cols-12 gap-0 bg-slate-100 border-b border-slate-200 text-[8px] font-black uppercase text-slate-500">
                      <div className="col-span-1 py-2 text-center border-r border-slate-200">Drag</div>
                      <div className="col-span-2 py-2 px-3 border-r border-slate-200">Time</div>
                      <div className="col-span-5 py-2 px-3 border-r border-slate-200">Activity</div>
                      <div className="col-span-3 py-2 px-3">PIC / Remarks</div>
                      <div className="col-span-1 py-2"></div>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white">
                      <div className="h-1 group relative">
                        <button onClick={() => insertItemAt(activeEventId, 0)} className="absolute inset-x-0 -top-2 flex justify-center opacity-0 group-hover:opacity-100 transition-all z-20">
                          <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg scale-75"><Plus size={10} strokeWidth={4} /></div>
                        </button>
                      </div>

                      {program.filter(p => p.parentId === activeEventId).sort((a, b) => a.order - b.order).map((item, index) => (
                        <div key={item.id} className="relative">
                          <div draggable onDragStart={() => onDragStart(index)} onDragOver={(e) => onDragOver(e, index)} className="grid grid-cols-12 gap-0 items-stretch group hover:bg-slate-50/50 transition-colors">
                            <div className="col-span-1 flex items-center justify-center border-r border-slate-100 text-slate-300 cursor-grab active:cursor-grabbing hover:text-emerald-500"><GripVertical size={14} /></div>
                            <div className="col-span-2 border-r border-slate-100">
                              <input className="w-full h-full px-3 py-2 bg-slate-50/30 text-[10px] font-bold text-emerald-900 outline-none focus:bg-white" defaultValue={item.time} onBlur={(e) => updateField('program', item.id, { time: e.target.value })} />
                            </div>
                            <div className="col-span-5 border-r border-slate-100">
                              <input className="w-full h-full px-3 py-2 bg-slate-50/30 text-[10px] font-bold outline-none focus:bg-white" defaultValue={item.activity} onBlur={(e) => updateField('program', item.id, { activity: e.target.value })} />
                            </div>
                            <div className="col-span-3">
                              <input className="w-full h-full px-3 py-2 bg-slate-50/30 text-[10px] italic text-slate-500 outline-none focus:bg-white" defaultValue={item.remarks} onBlur={(e) => updateField('program', item.id, { remarks: e.target.value })} />
                            </div>
                            <div className="col-span-1 flex items-center justify-center">
                              <button onClick={() => removeItem('program', item.id, 'slot')} className="text-red-200 hover:text-red-500 transition-all font-black">×</button>
                            </div>
                            <div className="col-span-11 col-start-2 px-3 pb-2 bg-slate-50/30">
                              <textarea
                                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-[9px] text-slate-400 outline-none focus:ring-1 ring-emerald-500 min-h-[24px] resize-none"
                                placeholder="Slot details..."
                                defaultValue={item.description}
                                onBlur={(e) => updateField('program', item.id, { description: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="h-2 group relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-100 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></div>
                            <button onClick={() => insertItemAt(activeEventId, item.order + 1)} className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-30">
                              <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform">
                                <Plus size={12} strokeWidth={4} />
                              </div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminActiveTab === 'logistics' && (
              <div className="space-y-12 animate-in fade-in">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b pb-4">
                    <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Catering Header</label>
                      <input className="w-full bg-transparent border-none font-serif italic text-xl md:text-2xl text-emerald-900 outline-none p-0" placeholder="e.g. Banquet Menu" defaultValue={siteContent?.cateringHeader} onBlur={(e) => updateSite({ cateringHeader: e.target.value })} />
                    </div>
                    <button onClick={() => addItem('catering', { group: '', dish: '', person: '' })} className="bg-emerald-900 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-800 transition-all">+ ADD MENU ITEM</button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-2 border-b border-slate-100 pb-2">
                      <div className="col-span-3 text-[8px] font-black uppercase text-slate-300">Meal Group</div>
                      <div className="col-span-5 text-[8px] font-black uppercase text-slate-300">Dish / Description</div>
                      <div className="col-span-3 text-[8px] font-black uppercase text-slate-300">PIC</div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                      {catering.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 md:gap-4 items-center group py-2 border-b border-slate-50 hover:bg-slate-50/50 rounded-lg px-2 transition-all">
                          <input className="col-span-3 text-[10px] font-black uppercase outline-none bg-transparent focus:text-emerald-700" defaultValue={item.group} onBlur={(e) => updateField('catering', item.id, { group: e.target.value })} placeholder="GROUP" />
                          <input className="col-span-5 text-[10px] font-bold outline-none bg-transparent focus:text-emerald-700" defaultValue={item.dish} onBlur={(e) => updateField('catering', item.id, { dish: e.target.value })} placeholder="DISH NAME" />
                          <input className="col-span-3 text-[10px] font-bold text-emerald-600 outline-none bg-transparent placeholder-slate-200" defaultValue={item.person} onBlur={(e) => updateField('catering', item.id, { person: e.target.value })} placeholder="PIC NAME" />
                          <button onClick={() => removeItem('catering', item.id, 'item')} className="col-span-1 text-red-200 hover:text-red-500 text-right font-black transition-colors">×</button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Pax Information / Specific Notes</label>
                      <textarea className="w-full bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 text-[10px] font-medium text-slate-600 outline-none focus:border-emerald-900 focus:bg-white transition-all h-20 resize-none" placeholder="e.g. Good for 200 pax. Extra rice on standby." defaultValue={siteContent?.paxNote} onBlur={(e) => updateSite({ paxNote: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-8 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center"><h3 className="font-bold text-emerald-900 text-[9px] uppercase tracking-widest">Global Logistics Notes</h3><button onClick={() => addItem('logisticsCards', { title: 'New Note', desc: '' })} className="text-emerald-700 font-bold text-[8px] bg-emerald-50 px-4 py-1.5 rounded-full shadow-sm">+ ADD CARD</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logisticsCards.filter(c => !c.parentId).map(card => (
                      <div key={card.id} className="p-4 bg-white border border-slate-100 rounded-2xl relative shadow-sm group">
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
              <div className="space-y-12 animate-in fade-in">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b pb-6">
                  <div>
                    <h3 className="font-serif italic text-2xl text-emerald-900 leading-none">Committee Architect</h3>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Global Department Manager</p>
                  </div>
                  <button onClick={() => addItem('committees', { title: 'New Dept', team: 'TBD', tasks: [] })} className="bg-emerald-900 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase shadow-md hover:bg-emerald-800 transition-all">+ ADD DEPARTMENT</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {committees.map(comm => (
                    <div key={comm.id} className="relative group space-y-6 pb-6 border-b border-slate-100 md:border-none">
                      <button onClick={() => removeItem('committees', comm.id, 'committee')} className="absolute top-0 right-0 text-red-200 hover:text-red-400 font-black">×</button>
                      <div className="space-y-1 pr-8">
                        <label className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Dept Name</label>
                        <input className="font-black uppercase text-sm w-full bg-transparent border-b border-slate-900 outline-none pb-1 tracking-widest focus:text-emerald-700" defaultValue={comm.title} onBlur={(e) => updateField('committees', comm.id, { title: e.target.value })} />
                      </div>

                      <div className="space-y-4">
                        {comm.tasks?.map((t, i) => (
                          <div key={i} className="relative group/task space-y-2 pb-2 border-b border-slate-50 last:border-none">
                            <div className="flex justify-between items-center">
                              <span className="text-[7px] font-black text-slate-200 uppercase">Task {i + 1}</span>
                              <button className="text-red-300 text-[10px] opacity-0 group-hover/task:opacity-100 transition-opacity" onClick={async () => { const ts = comm.tasks.filter((_, idx) => idx !== i); await updateField('committees', comm.id, { tasks: ts }); }}>Remove</button>
                            </div>
                            <textarea className="w-full bg-transparent text-[11px] p-0 border-none outline-none focus:text-emerald-700 font-medium leading-snug resize-none h-6" placeholder="What needs to be done?" defaultValue={t.text} onBlur={(e) => { let ts = [...comm.tasks]; ts[i].text = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} />
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div><label className="text-[6px] font-black text-slate-300 uppercase">Deadline</label><input type="date" className="w-full text-[10px] p-0 bg-transparent border-b border-slate-100 outline-none" defaultValue={t.dueDate} onChange={(e) => { let ts = [...comm.tasks]; ts[i].dueDate = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /></div>
                              <div><label className="text-[6px] font-black text-slate-300 uppercase">Owner</label><input type="text" className="w-full text-[10px] p-0 bg-transparent border-b border-slate-100 font-bold uppercase outline-none" placeholder="USER" defaultValue={t.assignee} onBlur={(e) => { let ts = [...comm.tasks]; ts[i].assignee = e.target.value; updateField('committees', comm.id, { tasks: ts }); }} /></div>
                            </div>
                          </div>
                        ))}
                        <button className="w-full py-2 bg-emerald-50 text-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all" onClick={async () => { const ts = [...(comm.tasks || []), { text: '', completed: false, dueDate: '', assignee: '' }]; await updateField('committees', comm.id, { tasks: ts }); }}>+ Add Item</button>
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
      <div className="font-bold text-emerald-900 text-lg md:text-2xl tracking-tighter uppercase">GSM <span className="font-light italic text-[#C5A021]">12th Anniversary</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D] selection:bg-emerald-100">
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-3 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0 pr-2 md:pr-4">
          <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="Logo" className="w-5 h-5 md:w-8 md:h-8 object-contain" />
          <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter uppercase">
            GSM <span className="font-light italic text-[#C5A021]">12th</span>
          </div>
        </div>

        <div className="flex justify-center items-center flex-1 gap-1 md:gap-6 overflow-hidden">
          {/* UPDATED TAB NAMES FOR SITE SYNC */}
          {['vision', 'floor', 'program', 'logistics', 'committees'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`text-[7px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] border-b-2 py-1 transition-all whitespace-nowrap ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'}`}>{t}</button>
          ))}
        </div>

        <div className="flex-shrink-0 flex justify-end pl-2 md:pl-4">
          <button
            onClick={() => isAdmin ? setView('admin') : setShowPasscodeModal(true)}
            className="bg-emerald-50 text-emerald-900 px-2 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 md:gap-2 border border-emerald-100 shadow-sm active:scale-95 transition-all hover:bg-emerald-100"
          >
            {isAdmin ? <LayoutDashboard size={12} strokeWidth={2.5} className="md:w-[14px] md:h-[14px]" /> : <LogIn size={12} strokeWidth={2.5} className="md:w-[14px] md:h-[14px]" />}
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {isAdmin ? 'Dash' : 'Log In'}
            </span>
          </button>
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
            <div className="flex flex-wrap bg-emerald-900/5 p-1 rounded-xl gap-2 shadow-inner">
              {masterEvents.filter(e => e.isActive !== false).map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setActiveEventSubTab(ev.id)}
                  className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${activeEventSubTab === ev.id ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                >
                  {ev.name}
                </button>
              ))}
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
              <div className="bg-emerald-900 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <h3 className="font-serif italic text-white text-lg tracking-tight leading-none">{siteContent?.cateringHeader || 'Catering'}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {catering.map((item, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-all flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{item.group}</span>
                      {item.person && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">PIC: {item.person}</span>}
                    </div>
                    <span className="text-[11px] md:text-[13px] font-bold text-emerald-900 tracking-tight leading-tight">{item.dish}</span>
                  </div>
                ))}
                {siteContent?.paxNote && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-[10px] italic text-slate-500 font-medium tracking-tight">Note: {siteContent.paxNote}</p>
                  </div>
                )}
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

        {/* FIXED TAB CONDITION FOR COMMITTEES SITE SYNC */}
        {activeTab === 'committees' && (
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