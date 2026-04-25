import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, addDoc, deleteDoc } from 'firebase/firestore';

export default function ChurchPortal() {
  const [view, setView] = useState('public');
  const [activeTab, setActiveTab] = useState('vision');
  const [adminActiveTab, setAdminActiveTab] = useState('settings');
  const [isBanquet, setIsBanquet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');

  const SECRET_CODE = 'GSM2026';

  // --- DATA STATES ---
  const [program, setProgram] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [catering, setCatering] = useState([]);
  const [logisticsCards, setLogisticsCards] = useState([]);
  const [visionActs, setVisionActs] = useState([]);
  const [mapObjects, setMapObjects] = useState([]);
  const [siteContent, setSiteContent] = useState({
    mainTitle: 'God of Restoration',
    subTitle: 'REBUILD • REVIVE • REIGN',
    verse: '"And to the masons, and hewers of stone..." — 2 Kings 12:12',
    programHeader: 'Minute-by-Minute Program Flow',
    cateringHeader: '7-Group Catering Matrix'
  });

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);

    onSnapshot(doc(db, 'site', 'content'), (snap) => snap.exists() && setSiteContent(prev => ({ ...prev, ...snap.data() })));
    onSnapshot(query(collection(db, 'program'), orderBy('time')), (snap) => setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'committees'), (snap) => setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'catering'), (snap) => setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'logisticsCards'), (snap) => setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'visionActs'), (snap) => setVisionActs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'mapObjects'), (snap) => setMapObjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // --- DB ACTIONS ---
  const updateField = async (col, id, data) => await updateDoc(doc(db, col, id), data);
  const updateSite = async (data) => await setDoc(doc(db, 'site', 'content'), data, { merge: true });
  const addItem = async (col, data) => await addDoc(collection(db, col), data);
  const removeItem = async (col, id, label) => {
    if (window.confirm(`Are you sure you want to delete this ${label}?`)) await deleteDoc(doc(db, col, id));
  };

  // --- DYNAMIC MAP RENDERER ---
  const MapRenderer = ({ mode }) => {
    return (
      <div className="relative w-full aspect-[1.4/1] border-[4px] border-[#2D2D2D] bg-white overflow-hidden rounded-sm shadow-xl mx-auto max-w-[950px]">
        {mapObjects.filter(obj => mode === 'banquet' ? obj.showInBanquet : obj.showInService).map(obj => (
          <div
            key={obj.id}
            onDoubleClick={() => {
              setAdminActiveTab('map-architect');
              setTimeout(() => {
                document.getElementById(`edit-${obj.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
            // Added border-black and bg-opacity-10 back for rooms
            className={`absolute flex items-center justify-center transition-all cursor-pointer ${obj.type === 'room' ? 'border-[1.5px] border-black bg-black/5 font-bold uppercase' :
              obj.type === 'block' ? 'bg-emerald-100/10 border border-emerald-900/10' :
                obj.type === 'icon' ? 'bg-blue-500 rounded-full border border-white shadow-sm' :
                  'bg-orange-400 border border-orange-600 shadow-sm'
              }`}
            style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%`, zIndex: obj.z || 10 }}
          >
            {/* Reduced Label Font to 6px - Tiny and non-intrusive */}
            {obj.label && (
              <span className="pointer-events-none px-0.5 text-center leading-none z-50 text-black text-[6px] font-black tracking-tighter">
                {obj.label}
              </span>
            )}

            {/* Dynamic Seating Grid */}
            {obj.type === 'block' && (
              <div
                className="absolute inset-0 p-1 gap-1 grid"
                style={{
                  gridTemplateColumns: `repeat(${obj.cols || 4}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${obj.rows || 6}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: (obj.rows || 6) * (obj.cols || 4) }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-emerald-600 rounded-full opacity-60 mx-auto" />
                ))}
              </div>
            )}
          </div>
        ))}
        {/* Hall Background Labels */}
        <div className="absolute font-black text-[9px] md:text-[11px] uppercase opacity-5 text-emerald-900 pointer-events-none" style={{ top: '40%', left: '38%' }}>Main Hall</div>
        <div className="absolute font-black text-[9px] uppercase opacity-5 text-emerald-900 rotate-90 pointer-events-none" style={{ top: '35%', left: '76%' }}>Front Hall</div>
      </div>
    );
  };

  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === SECRET_CODE) { setIsAdmin(true); setView('admin'); setShowPasscodeModal(false); localStorage.setItem('gsm_admin', 'true'); }
    else alert('Invalid Code');
  };

  // --- 1. DEDICATED FULL-PAGE ADMIN VIEW ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-white border-b p-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
          <h1 className="font-serif italic font-bold text-emerald-900 text-xl">GSM Master Backend</h1>
          <button onClick={() => setView('public')} className="text-[10px] font-bold uppercase px-6 py-2 bg-emerald-900 text-white rounded-full">Return to Site</button>
        </nav>

        <main className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {['settings', 'map-architect', 'vision', 'program', 'committees', 'logistics'].map(t => (
              <button key={t} onClick={() => setAdminActiveTab(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${adminActiveTab === t ? 'bg-emerald-900 text-white shadow-md' : 'bg-white text-slate-400 border'}`}>{t.replace('-', ' ')}</button>
            ))}
          </div>

          <div className="bg-white p-6 md:p-10 rounded-3xl border shadow-sm min-h-[600px]">
            {adminActiveTab === 'settings' && (
              <div className="space-y-8 max-w-2xl">
                <h3 className="font-bold text-emerald-900 text-[10px] uppercase border-b pb-2 tracking-widest italic">Header & Branding Architect</h3>

                <div className="grid grid-cols-1 gap-6 bg-slate-50 p-6 rounded-3xl border shadow-inner">
                  {/* Main Title Editor */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Site Main Title</label>
                    <input
                      className="w-full p-3 border rounded-xl mt-1 text-sm font-serif italic outline-none focus:border-emerald-500 transition-all"
                      defaultValue={siteContent.mainTitle}
                      onBlur={(e) => updateSite({ mainTitle: e.target.value })}
                    />
                  </div>

                  {/* Subtitle Editor (Rebuild, Revive, Reign) */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Subtitle / Theme Slogan</label>
                    <input
                      className="w-full p-3 border rounded-xl mt-1 text-[11px] font-bold tracking-[0.2em] uppercase outline-none focus:border-emerald-500 transition-all"
                      defaultValue={siteContent.subTitle}
                      placeholder="REBUILD • REVIVE • REIGN"
                      onBlur={(e) => updateSite({ subTitle: e.target.value })}
                    />
                  </div>

                  {/* Bible Verse Editor */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Featured Bible Verse</label>
                    <textarea
                      className="w-full p-3 border rounded-xl mt-1 h-28 text-xs font-serif italic leading-relaxed outline-none focus:border-emerald-500 transition-all"
                      defaultValue={siteContent.verse}
                      placeholder="Enter the main scripture here..."
                      onBlur={(e) => updateSite({ verse: e.target.value })}
                    />
                  </div>
                </div>

                {/* Table Header Customization */}
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-emerald-800 uppercase italic">Section Headers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-bold text-slate-400">PROGRAM TAB HEADER</label>
                      <input className="w-full p-2 text-xs border rounded-lg" defaultValue={siteContent.programHeader} onBlur={(e) => updateSite({ programHeader: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400">LOGISTICS TAB HEADER</label>
                      <input className="w-full p-2 text-xs border rounded-lg" defaultValue={siteContent.cateringHeader} onBlur={(e) => updateSite({ cateringHeader: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'map-architect' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border">
                    <h3 className="text-[10px] font-bold uppercase mb-4 tracking-widest">Architect Preview</h3>
                    <MapRenderer mode={isBanquet ? 'banquet' : 'service'} />
                    <div className="flex gap-4 mt-4">
                      <button onClick={() => setIsBanquet(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase ${!isBanquet ? 'bg-emerald-900 text-white' : 'bg-white border'}`}>Service Layout</button>
                      <button onClick={() => setIsBanquet(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase ${isBanquet ? 'bg-orange-600 text-white' : 'bg-white border'}`}>Banquet Layout</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <button onClick={() => addItem('mapObjects', { type: 'room', label: 'New Room', x: 20, y: 20, w: 15, h: 15, showInService: true, showInBanquet: true, z: 10 })} className="w-full py-4 bg-emerald-900 text-white rounded-xl font-bold text-[10px] uppercase">+ Create New Object</button>
                  <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {mapObjects.map(obj => (
                      <div
                        key={obj.id}
                        id={`edit-${obj.id}`} // <--- This allows the map to "find" this card
                        className="p-4 bg-slate-50 rounded-xl border relative space-y-3 focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <select className="text-[10px] font-bold uppercase outline-none bg-transparent" value={obj.type} onChange={(e) => updateField('mapObjects', obj.id, { type: e.target.value })}>
                            <option value="room">Room/Outline</option>
                            <option value="block">Seating Block (Dots)</option>
                            <option value="icon">Icon/Circle</option>
                            <option value="table">Table</option>
                          </select>
                          <button onClick={() => removeItem('mapObjects', obj.id, 'map object')} className="text-red-400">×</button>
                        </div>

                        <input className="w-full p-1 text-[10px] border rounded font-bold" value={obj.label} placeholder="Label Name" onChange={(e) => updateField('mapObjects', obj.id, { label: e.target.value })} />

                        {/* Coordinate Controls */}
                        <div className="grid grid-cols-4 gap-1 text-[8px] font-bold">
                          <div>X%<input type="number" className="w-full p-1 border rounded" value={obj.x} onChange={(e) => updateField('mapObjects', obj.id, { x: parseFloat(e.target.value) })} /></div>
                          <div>Y%<input type="number" className="w-full p-1 border rounded" value={obj.y} onChange={(e) => updateField('mapObjects', obj.id, { y: parseFloat(e.target.value) })} /></div>
                          <div>W%<input type="number" className="w-full p-1 border rounded" value={obj.w} onChange={(e) => updateField('mapObjects', obj.id, { w: parseFloat(e.target.value) })} /></div>
                          <div>H%<input type="number" className="w-full p-1 border rounded" value={obj.h} onChange={(e) => updateField('mapObjects', obj.id, { h: parseFloat(e.target.value) })} /></div>
                        </div>

                        {/* NEW: Grid Controls (Only shows if type is 'block') */}
                        {obj.type === 'block' && (
                          <div className="grid grid-cols-2 gap-2 bg-emerald-50 p-2 rounded-lg">
                            <div><label className="text-[8px] font-bold text-emerald-700 uppercase">Columns (Vertical)</label>
                              <input type="number" className="w-full p-1 border rounded text-[10px]" value={obj.cols || 4} onChange={(e) => updateField('mapObjects', obj.id, { cols: parseInt(e.target.value) })} /></div>
                            <div><label className="text-[8px] font-bold text-emerald-700 uppercase">Rows (Horizontal)</label>
                              <input type="number" className="w-full p-1 border rounded text-[10px]" value={obj.rows || 6} onChange={(e) => updateField('mapObjects', obj.id, { rows: parseInt(e.target.value) })} /></div>
                          </div>
                        )}

                        <div className="flex gap-4 items-center mt-2">
                          <label className="text-[8px] font-bold flex items-center gap-1"><input type="checkbox" checked={obj.showInService} onChange={(e) => updateValue('mapObjects', obj.id, { showInService: e.target.checked })} /> SERVICE</label>
                          <label className="text-[8px] font-bold flex items-center gap-1"><input type="checkbox" checked={obj.showInBanquet} onChange={(e) => updateValue('mapObjects', obj.id, { showInBanquet: e.target.checked })} /> BANQUET</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'vision' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="font-bold text-emerald-900 text-xs uppercase">Vision Acts</h3><button onClick={() => addItem('visionActs', { title: 'New Act', desc: 'Description...' })} className="text-emerald-700 font-bold text-[10px]">+ ADD ACT</button></div>
                {visionActs.map(act => (
                  <div key={act.id} className="p-6 bg-slate-50 rounded-2xl relative mb-4">
                    <button onClick={() => removeItem('visionActs', act.id, 'act')} className="absolute top-4 right-4 text-red-300">×</button>
                    <input className="font-bold text-emerald-900 w-full bg-transparent border-b border-dashed mb-2" defaultValue={act.title} onBlur={(e) => updateField('visionActs', act.id, { title: e.target.value })} />
                    <textarea className="w-full text-xs p-3 rounded-xl border mt-2 h-24" defaultValue={act.desc} onBlur={(e) => updateField('visionActs', act.id, { desc: e.target.value })} />
                  </div>
                ))}
              </div>
            )}

            {adminActiveTab === 'program' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-emerald-900 text-xs uppercase">Schedule</h3><button onClick={() => addItem('program', { time: '00:00', activity: 'New Task', style: 'bg-white' })} className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-4 py-2 rounded-full">+ ADD SLOT</button></div>
                {program.map(item => (
                  <div key={item.id} className="flex gap-4 border-b pb-4 items-center">
                    <input className="w-24 text-[10px] font-bold outline-none" defaultValue={item.time} onBlur={(e) => updateField('program', item.id, { time: e.target.value })} />
                    <input className="flex-1 text-[10px] outline-none" defaultValue={item.activity} onBlur={(e) => updateField('program', item.id, { activity: e.target.value })} />
                    <button onClick={() => removeItem('program', item.id, 'time slot')} className="text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}

            {adminActiveTab === 'committees' && (
              <div className="space-y-8">
                <button onClick={() => addItem('committees', { title: 'New Committee', team: 'TBD', color: 'border-emerald-900', tasks: ['Task 1'] })} className="w-full border-2 border-dashed p-6 text-slate-400 rounded-2xl uppercase font-bold text-[10px]">+ ADD COMMITTEE CARD</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {committees.map(comm => (
                    <div key={comm.id} className="p-6 bg-slate-50 rounded-2xl border relative">
                      <button onClick={() => removeItem('committees', comm.id, 'committee')} className="absolute top-4 right-4 text-red-300">×</button>
                      <input className="font-bold uppercase text-xs w-full bg-transparent border-b border-dashed mb-2" defaultValue={comm.title} onBlur={(e) => updateField('committees', comm.id, { title: e.target.value })} />
                      <input className="text-[10px] text-slate-400 w-full mb-4 bg-transparent italic" defaultValue={comm.team} onBlur={(e) => updateField('committees', comm.id, { team: e.target.value })} />
                      {comm.tasks?.map((t, i) => (
                        <textarea key={i} className="w-full text-[10px] p-2 rounded border mb-2 h-14 bg-white" defaultValue={t} onBlur={(e) => {
                          let ts = [...comm.tasks]; ts[i] = e.target.value; updateField('committees', comm.id, { tasks: ts });
                        }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminActiveTab === 'logistics' && (
              <div className="space-y-12">
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-6 border-b pb-2"><h3 className="font-bold text-emerald-900 text-xs uppercase tracking-widest">Catering Matrix</h3><button onClick={() => addItem('catering', { group: 'New Group', dish: 'TBD' })} className="text-emerald-700 font-bold text-[10px]">+ ADD GROUP</button></div>
                  {catering.map(item => (
                    <div key={item.id} className="flex gap-4 border-b py-2 items-center">
                      <input className="font-bold text-[10px] uppercase w-1/3 bg-transparent" defaultValue={item.group} onBlur={(e) => updateField('catering', item.id, { group: e.target.value })} />
                      <input className="text-[10px] flex-1 bg-transparent" defaultValue={item.dish} onBlur={(e) => updateField('catering', item.id, { dish: e.target.value })} />
                      <button onClick={() => removeItem('catering', item.id, 'catering item')} className="text-red-400">×</button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-400">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-emerald-900 text-xs uppercase">Info Cards</h3><button onClick={() => addItem('logisticsCards', { title: 'New Card', desc: 'Content here...', color: 'border-emerald-800' })} className="text-emerald-700 font-bold text-[10px]">+ ADD INFO CARD</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logisticsCards.map(card => (
                      <div key={card.id} className="p-4 bg-white border rounded-xl relative">
                        <button onClick={() => removeItem('logisticsCards', card.id, 'logistics card')} className="absolute top-2 right-2 text-red-300">×</button>
                        <input className="font-bold uppercase text-[10px] text-emerald-900 w-full mb-2 border-b border-dashed" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                        <textarea className="w-full text-xs text-slate-500 bg-slate-50 p-2 rounded h-24" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
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

  // --- 2. PUBLIC SITE VIEW ---
  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D] selection:bg-emerald-100">
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-2 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter w-[20%]">GSM <span className="font-light italic text-[#C5A021]">12th</span></div>
        <div className="flex justify-between items-center w-[80%] pr-1 md:pr-0">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`text-[6.5px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] border-b-2 py-1 whitespace-nowrap ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'}`}>{t === 'checklist' ? 'Committees' : t}</button>
          ))}
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <header className="text-center mb-8 md:mb-12 px-4 animate-in fade-in duration-700">
          {/* Main Title */}
          <h1 className="text-4xl md:text-7xl font-serif text-emerald-900 mb-2 md:mb-3 italic leading-tight tracking-tight">
            {siteContent.mainTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-[#C5A021] font-bold tracking-[0.25em] md:tracking-[0.3em] text-[10px] md:text-sm mb-4 md:mb-6 uppercase">
            {siteContent.subTitle}
          </p>

          {/* Fluid Verse - Dynamic sizing with tighter spacing */}
          <div className="max-w-xs md:max-w-4xl mx-auto">
            <p className="text-emerald-800 font-serif italic opacity-75 leading-relaxed 
                  text-[12px] sm:text-[14px] md:text-[18px] lg:text-[20px] 
                  md:line-clamp-2 overflow-hidden">
              {siteContent.verse}
            </p>
          </div>
        </header>

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-in duration-500">
            {/* Pillars Section */}
            <div className="bg-emerald-900 text-white p-6 md:p-10 rounded-3xl shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-serif mb-6 md:mb-8 text-[#C5A021]">The 4 Spiritual Pillars</h2>
              <div className="space-y-6 md:space-y-8">
                {[{ t: '1. Glorifying God', d: 'Every aesthetic and program element points back to Him.' }, { t: '2. Highlighting His Name', d: 'Making His presence the absolute focal point of the day.' }, { t: '3. God’s Faithfulness', d: 'Space for the congregation to reflect on His provision.' }, { t: '4. Exaltation through History', d: "Acknowledging His hand in GSM's 12-year journey." }].map((p, i) => (
                  <div key={i} className="border-l-2 border-[#C5A021] pl-4 md:pl-6">
                    <h4 className="font-bold uppercase text-[10px] md:text-xs text-[#C5A021] mb-1 md:mb-2">{p.t}</h4>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{p.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acts Section - Stacks on Mobile */}
            <div className="flex flex-col gap-3 md:gap-4">
              {visionActs.length > 0 ? visionActs.map(act => (
                <div key={act.id} className="bg-white p-5 md:p-8 rounded-2xl border shadow-sm border-l-[6px] md:border-l-8 border-emerald-900">
                  <h3 className="font-serif text-lg md:text-xl mb-1 md:mb-2 italic text-emerald-900">{act.title}</h3>
                  <p className="text-[11px] md:text-sm text-gray-600 leading-relaxed">{act.desc}</p>
                </div>
              )) : (
                <div className="text-center p-10 italic text-gray-400 text-xs">Loading Vision...</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'floor' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="font-bold text-emerald-900 uppercase text-xs tracking-widest mb-3 italic">
                  {siteContent.mapHeader || 'Floor Plan Architect v5.1'}
                </h3>
                {/* Visual Mini-Legend next to Header */}
                <div className="flex gap-4 text-[9px] font-bold uppercase text-gray-400">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Seating</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 border border-black bg-white" /> Rooms</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> T&O</div>
                </div>
              </div>
              <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase shadow-lg active:scale-95 transition-all">
                {isBanquet ? 'To Service Layout' : 'To Banquet Layout'}
              </button>
            </div>

            <MapRenderer mode={isBanquet ? 'banquet' : 'service'} />

            {/* THE MAIN LEGEND TILES */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Rooms Legend */}
              <div className="p-4 bg-white border rounded-2xl shadow-sm flex flex-col items-center text-center">
                <div className="w-6 h-4 border-2 border-black bg-slate-50 mb-2" />
                <p className="text-[9px] font-black uppercase text-emerald-900 leading-tight">
                  {siteContent.legendRooms || 'Rooms & Walls'}
                </p>
              </div>

              {/* Seating Legend */}
              <div className="p-4 bg-white border rounded-2xl shadow-sm flex flex-col items-center text-center">
                <div className="flex gap-1 mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <p className="text-[9px] font-black uppercase text-emerald-900 leading-tight">
                  {siteContent.legendSeating || 'Guest Seating'}
                </p>
              </div>

              {/* Entry/Icon Legend */}
              <div className="p-4 bg-white border rounded-2xl shadow-sm flex flex-col items-center text-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm mb-2" />
                <p className="text-[9px] font-black uppercase text-emerald-900 leading-tight">
                  {siteContent.legendEntry || 'T&O / Reception'}
                </p>
              </div>

              {/* Banquet Legend */}
              <div className="p-4 bg-white border rounded-2xl shadow-sm flex flex-col items-center text-center">
                <div className="w-6 h-4 bg-orange-400 border border-orange-600 mb-2" />
                <p className="text-[9px] font-black uppercase text-emerald-900 leading-tight">
                  {siteContent.legendBanquet || 'Banquet Setup'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'program' && (
          <div className="bg-white rounded-2xl md:rounded-3xl border shadow-xl overflow-hidden animate-in">
            <div className="p-5 md:p-8 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="font-serif text-lg md:text-2xl italic">{siteContent.programHeader}</h3>
            </div>
            <div className="overflow-x-auto"> {/* Allows side-scrolling if it gets too tight */}
              <table className="w-full text-left">
                <tbody className="text-[10px] md:text-sm divide-y divide-gray-50">
                  {program.map((row, i) => (
                    <tr key={i} className={row.style}>
                      <td className="p-3 md:p-5 font-bold w-20 md:w-32 border-r bg-slate-50/50">{row.time}</td>
                      <td className="p-3 md:p-5 leading-tight md:leading-normal">{row.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in">
            {/* Catering List */}
            <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border shadow-sm border-t-8 border-emerald-900">
              <h3 className="font-serif text-2xl md:text-3xl text-emerald-900 mb-6 md:mb-8 italic underline decoration-[#C5A021]">
                {siteContent.cateringHeader}
              </h3>
              <div className="space-y-1">
                {catering.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 gap-4">
                    <span className="font-medium text-[11px] md:text-sm text-gray-700 uppercase tracking-tighter">{item.group}</span>
                    <span className="font-bold text-[11px] md:text-sm text-orange-800 text-right">{item.dish}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logistic Cards */}
            <div className="flex flex-col gap-4 md:gap-6">
              {logisticsCards.map(card => (
                <div key={card.id} className={`bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border shadow-sm border-l-[6px] md:border-l-8 ${card.color || 'border-emerald-800'}`}>
                  <h4 className="font-bold text-emerald-900 uppercase text-[9px] md:text-[10px] mb-2 md:mb-3 tracking-widest">{card.title}</h4>
                  <p className="text-[11px] md:text-sm leading-relaxed font-sans text-gray-600 whitespace-pre-line">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {committees.map((comm) => (
              <div key={comm.id} className={`bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-t-8 ${comm.color || 'border-emerald-900'} shadow-md`}>
                <h3 className="font-bold text-emerald-900 text-xs md:text-sm uppercase mb-1">{comm.title}</h3>
                <p className="text-[8px] md:text-[10px] text-gray-400 font-bold mb-3 md:mb-4 uppercase tracking-tighter">{comm.team}</p>
                <div className="space-y-2">
                  {comm.tasks?.map((t, i) => (
                    <div key={i} className="flex gap-2 text-[10px] md:text-[0.75rem] text-gray-600 bg-gray-50 p-2 md:p-3 rounded-xl border border-gray-100 italic">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-20 border-t pt-10 text-center flex flex-col items-center gap-4">
          {isAdmin && (
            <button onClick={() => { setView('admin'); setAdminActiveTab('map-architect'); }} className="text-emerald-800 font-bold uppercase text-[10px] bg-emerald-50 px-8 py-3 rounded-full border border-emerald-100 shadow-sm active:scale-95 transition-all">Open Master Dashboard</button>
          )}
          <button onClick={() => setShowPasscodeModal(true)} className="text-gray-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>
        </footer>

        {showPasscodeModal && (
          <div className="fixed inset-0 z-[1000] bg-emerald-900/95 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl w-full max-w-xs shadow-2xl text-center animate-in zoom-in-95 duration-200">
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