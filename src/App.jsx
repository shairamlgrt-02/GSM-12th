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
    
    onSnapshot(query(collection(db, 'program'), orderBy('time')), (snap) => {
      setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'committees'), (snap) => {
      setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'catering'), (snap) => {
      setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(collection(db, 'logisticsCards'), (snap) => {
      setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // --- DB ACTIONS WITH SAFETY ---
  const updateField = async (col, id, data) => await updateDoc(doc(db, col, id), data);
  const updateSite = async (data) => await setDoc(doc(db, 'site', 'content'), data, { merge: true });
  const addItem = async (col, data) => await addDoc(collection(db, col), data);
  
  const removeItem = async (col, id, label) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${label}?`);
    if (confirmDelete) {
      await deleteDoc(doc(db, col, id));
    }
  };

  // --- MAP LOGIC (100% RESTORED DETAIL) ---
  const renderServiceDots = () => {
    const dots = [];
    const drawBlock = (startX, startY, cols, rows, isLead) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push(<div key={`dot-${startX}-${startY}-${r}-${c}`} className={`absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-sm border z-20 ${isLead ? 'bg-[#fef08a] border-[#854d0e]' : 'bg-[#86efac] border-[#166534]'}`} style={{ left: `${startX + c * 2.8}%`, top: `${startY + r * 4.2}%` }} />);
        }
      }
    };
    drawBlock(19, 15, 4, 6, false); drawBlock(31.5, 15, 4, 6, false); drawBlock(45, 12, 4, 7, false); drawBlock(61, 12, 4, 4, false); drawBlock(61, 35, 4, 3, false); drawBlock(80.5, 52.5, 4, 3, true);
    return dots;
  };

  const renderBanquetLayout = () => {
    const tables = [{ x: 22, y: 23, w: 11, h: 15 }, { x: 38.5, y: 23, w: 11, h: 15 }, { x: 55, y: 23, w: 11, h: 15 }, { x: 73, y: 17, w: 10, h: 18 }, { x: 73, y: 43, w: 10, h: 18 }];
    const freeAreas = [{ x: 16.5, y: 14, w: 1.5, h: 30 }, { x: 21.5, y: 12, w: 18, h: 3 }, { x: 45, y: 10, w: 25, h: 4 }, { x: 59, y: 40, w: 13, h: 4 }, { x: 40, y: 46, w: 10, h: 3 }, { x: 72, y: 60, w: 10, h: 4 }, { x: 80, y: 51, w: 10, h: 12 }];
    return (
      <>{tables.map((t, i) => <div key={`tbl-${i}`} className="absolute bg-[#e67e22] border border-[#d35400] z-25 rounded-sm" style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%` }} />)}{freeAreas.map((a, i) => <div key={`free-${i}`} className="absolute bg-[#4ade80] opacity-80 border border-[#166534] z-24" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }} />)}</>
    );
  };

  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === SECRET_CODE) { setIsAdmin(true); setShowPasscodeModal(false); localStorage.setItem('gsm_admin', 'true'); setView('admin'); }
    else { alert('Incorrect Code'); }
  };

  // --- 1. ADMIN DASHBOARD VIEW ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-white border-b p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
          <h1 className="font-serif italic font-bold text-emerald-900 text-xl">GSM Master Backend</h1>
          <button onClick={() => setView('public')} className="text-[10px] font-bold uppercase px-6 py-2 bg-emerald-900 text-white rounded-full">Return to Site</button>
        </nav>
        <main className="max-w-6xl mx-auto p-6">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {['settings', 'program', 'committees', 'logistics'].map(t => (
              <button key={t} onClick={() => setAdminActiveTab(t)} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${adminActiveTab === t ? 'bg-emerald-900 text-white' : 'bg-white text-slate-400 border'}`}>{t}</button>
            ))}
          </div>
          <div className="bg-white p-6 md:p-10 rounded-3xl border shadow-sm">
            {adminActiveTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="font-bold text-emerald-900 text-xs uppercase border-b pb-2 tracking-widest">Global Branding</h3>
                <div><label className="text-[10px] font-bold text-slate-400">Main Title</label><input className="w-full p-2 border rounded mt-1" defaultValue={siteContent.mainTitle} onBlur={(e) => updateSite({ mainTitle: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-slate-400">Subtitle</label><input className="w-full p-2 border rounded mt-1" defaultValue={siteContent.subTitle} onBlur={(e) => updateSite({ subTitle: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-slate-400">Verse</label><textarea className="w-full p-2 border rounded mt-1 h-20" defaultValue={siteContent.verse} onBlur={(e) => updateSite({ verse: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-slate-400">Program Header</label><input className="w-full p-2 border rounded mt-1" defaultValue={siteContent.programHeader} onBlur={(e) => updateSite({ programHeader: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold text-slate-400">Catering Header</label><input className="w-full p-2 border rounded mt-1" defaultValue={siteContent.cateringHeader} onBlur={(e) => updateSite({ cateringHeader: e.target.value })} /></div>
              </div>
            )}
            {adminActiveTab === 'program' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-emerald-900 text-xs uppercase tracking-widest">Schedule</h3><button onClick={() => addItem('program', { time: '00:00', activity: 'New Task', style: 'bg-white' })} className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-3 py-1 rounded-full">+ ADD SLOT</button></div>
                {program.map(item => (
                  <div key={item.id} className="flex gap-4 border-b pb-2 items-center">
                    <input className="w-24 text-[10px] font-bold" defaultValue={item.time} onBlur={(e) => updateField('program', item.id, { time: e.target.value })} />
                    <input className="flex-1 text-[10px]" defaultValue={item.activity} onBlur={(e) => updateField('program', item.id, { activity: e.target.value })} />
                    <button onClick={() => removeItem('program', item.id, 'time slot')} className="text-red-400 font-bold">×</button>
                  </div>
                ))}
              </div>
            )}
            {adminActiveTab === 'committees' && (
              <div className="space-y-8">
                <button onClick={() => addItem('committees', { title: 'New Committee', team: 'TBD', color: 'border-emerald-900', tasks: ['Task 1'] })} className="w-full border-2 border-dashed p-4 text-slate-400 rounded-xl uppercase font-bold text-[10px] hover:bg-slate-50">+ ADD COMMITTEE CARD</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {committees.map(comm => (
                    <div key={comm.id} className="p-6 bg-slate-50 rounded-2xl border shadow-inner">
                      <div className="flex justify-between mb-4"><input className="font-bold uppercase text-xs w-full bg-transparent outline-none border-b border-dashed" defaultValue={comm.title} onBlur={(e) => updateField('committees', comm.id, { title: e.target.value })} /><button onClick={() => removeItem('committees', comm.id, 'committee card')} className="text-red-500 font-bold text-lg">×</button></div>
                      <input className="text-[10px] text-slate-400 w-full mb-4 bg-transparent outline-none" defaultValue={comm.team} onBlur={(e) => updateField('committees', comm.id, { team: e.target.value })} />
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
                <div className="bg-slate-50 p-6 rounded-2xl shadow-inner">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-emerald-900 text-xs uppercase tracking-widest">Catering</h3><button onClick={() => addItem('catering', { group: 'New Group', dish: 'TBD' })} className="text-emerald-700 font-bold text-[10px]">+ ADD GROUP</button></div>
                  {catering.map(item => (
                    <div key={item.id} className="flex gap-4 border-b py-2 items-center">
                      <input className="font-bold text-[10px] uppercase w-1/3 bg-transparent" defaultValue={item.group} onBlur={(e) => updateField('catering', item.id, { group: e.target.value })} />
                      <input className="text-[10px] flex-1 bg-transparent" defaultValue={item.dish} onBlur={(e) => updateField('catering', item.id, { dish: e.target.value })} />
                      <button onClick={() => removeItem('catering', item.id, 'catering group')} className="text-red-400">×</button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-400 shadow-sm">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-emerald-900 text-xs uppercase tracking-widest">Logistics Info Cards</h3><button onClick={() => addItem('logisticsCards', { title: 'New Info Card', desc: 'Content here...', color: 'border-emerald-800' })} className="text-emerald-700 font-bold text-[10px]">+ ADD INFO CARD</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {logisticsCards.map(card => (
                      <div key={card.id} className="p-4 bg-white border rounded-xl shadow-sm relative">
                        <button onClick={() => removeItem('logisticsCards', card.id, 'logistics card')} className="absolute top-2 right-2 text-red-300 font-bold">×</button>
                        <input className="font-bold uppercase text-[10px] text-emerald-900 w-full outline-none mb-2 border-b border-dashed" defaultValue={card.title} onBlur={(e) => updateField('logisticsCards', card.id, { title: e.target.value })} />
                        <textarea className="w-full text-xs text-slate-500 bg-slate-50 p-2 rounded outline-none h-24" defaultValue={card.desc} onBlur={(e) => updateField('logisticsCards', card.id, { desc: e.target.value })} />
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

  // --- 2. PUBLIC VIEW (FULL ORIGINAL DESIGN) ---
  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D]">
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-2 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter w-[20%]">GSM <span className="font-light italic text-[#C5A021]">12th</span></div>
        <div className="flex justify-between items-center w-[80%] pr-1 md:pr-0">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`text-[6.5px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] border-b-2 py-1 whitespace-nowrap ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'}`}>{t === 'checklist' ? 'Committees' : t}</button>
          ))}
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <header className="text-center mb-16 px-4">
          <h1 className="text-5xl md:text-7xl font-serif text-emerald-900 mb-2 italic leading-tight">{siteContent.mainTitle}</h1>
          <p className="text-[#C5A021] font-bold tracking-[0.3em] text-[10px] md:text-sm mb-4 uppercase">{siteContent.subTitle}</p>
          <p className="text-emerald-800 font-serif italic text-lg md:text-2xl opacity-80 leading-relaxed whitespace-pre-line">{siteContent.verse}</p>
        </header>

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in duration-500">
            <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-serif mb-8 text-[#C5A021]">The 4 Spiritual Pillars</h2>
              <div className="space-y-8">
                {[{t:'1. Glorifying God', d:'Every aesthetic and program element points back to Him.'}, {t:'2. Highlighting His Name', d:'Making His presence the absolute focal point of the day.'}, {t:'3. God’s Faithfulness', d:'Space for the congregation to reflect on His provision.'}, {t:'4. Exaltation through History', d:"Acknowledging His hand in GSM's 12-year journey."}].map((p, i) => (
                  <div key={i} className="border-l-2 border-[#C5A021] pl-6"><h4 className="font-bold uppercase text-xs text-[#C5A021] mb-2">{p.t}</h4><p className="text-gray-300 text-sm">{p.d}</p></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
               <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-900 font-serif italic text-xl">Rebuild (Act I)</div>
               <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-600 font-serif italic text-xl">Revive (Act II)</div>
               <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-[#C5A021] font-serif italic text-xl">Reign (Act III)</div>
            </div>
          </div>
        )}

        {activeTab === 'floor' && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h3 className="font-bold text-emerald-900 uppercase text-xs tracking-widest mb-3">Blueprint: Spatial Engineering v3.3</h3>
                <div className="flex flex-wrap gap-4">
                  {!isBanquet ? (
                    <><div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500"><div className="w-3 h-3 bg-[#86efac] rounded-sm" /> Guest Seats</div><div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500"><div className="w-3 h-3 bg-[#fef08a] border border-[#854d0e] rounded-sm" /> Leaders</div><div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500"><div className="w-3 h-3 bg-[#3b82f6] rounded-full" /> T&O Box</div></>
                  ) : (
                    <><div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500"><div className="w-3 h-3 bg-[#e67e22] rounded-sm" /> Tables</div><div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500"><div className="w-3 h-3 bg-[#4ade80] rounded-sm" /> Free Seating</div></>
                  )}
                </div>
              </div>
              <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase mb-10 shadow-lg active:scale-95 transition-all">{isBanquet ? 'To Service' : 'To Banquet'}</button>
            </div>
            <div className="relative w-full aspect-[1.4/1] border-[6px] border-[#2D2D2D] bg-white overflow-hidden mx-auto max-w-[900px] rounded-sm shadow-inner">
               {!isBanquet ? (
                 <>
                   <div className="absolute border border-black z-10 flex items-center justify-center font-black text-[0.5rem] md:text-[0.65rem] uppercase bg-white/50" style={{top: '12.5%', left: '19.5%', width: '53.5%', height: '38.5%'}}>Main Hall</div>
                   <div className="absolute border border-black border-l-dashed z-10 flex items-center justify-center font-black text-[0.5rem] uppercase bg-[#fffcf0] text-orange-700" style={{top: '12.5%', left: '73%', width: '14%', height: '38.5%'}}>Overflow</div>
                   <div className="absolute border border-black bg-gray-100 z-10 flex items-center justify-center font-black text-[0.65rem] uppercase" style={{top: '12.5%', left: '87%', width: '10%', height: '38.5%'}}>Stage</div>
                   <div className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50" style={{left: '44%', top: '44%'}} /><div className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50" style={{left: '75%', top: '30%'}} />
                   {renderServiceDots()}
                 </>
               ) : renderBanquetLayout()}
            </div>
          </div>
        )}

        {activeTab === 'program' && (
          <div className="bg-white rounded-3xl border shadow-2xl overflow-hidden animate-in">
            <div className="p-8 bg-emerald-900 text-white flex justify-between items-center"><h3 className="font-serif text-2xl italic">{siteContent.programHeader}</h3><span className="text-xs font-black uppercase tracking-widest text-[#C5A021]">May 29</span></div>
            <table className="w-full text-left"><tbody className="text-[0.8rem] md:text-sm divide-y divide-gray-50">
              {program.map((row, i) => (<tr key={i} className={row.style}><td className="p-5 font-bold w-32 border-r">{row.time}</td><td className="p-5">{row.activity}</td></tr>))}
            </tbody></table>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
            <div className="bg-white p-8 md:p-10 rounded-3xl border shadow-sm border-t-8 border-emerald-900">
              <h3 className="font-serif text-3xl text-emerald-900 mb-8 italic underline decoration-[#C5A021]">{siteContent.cateringHeader}</h3>
              {catering.map((item, i) => (
                <div key={i} className="flex justify-between p-4 border-b border-gray-50"><span className="font-medium text-gray-700">{item.group}</span><span className="font-bold text-orange-800">{item.dish}</span></div>
              ))}
            </div>
            <div className="flex flex-col gap-6">
               {logisticsCards.map(card => (
                 <div key={card.id} className={`bg-white p-8 rounded-3xl border shadow-sm border-l-8 ${card.color || 'border-emerald-800'}`}>
                    <h4 className="font-bold text-emerald-900 uppercase text-[10px] mb-3 tracking-widest text-left">{card.title}</h4>
                    <p className="text-sm leading-relaxed font-sans text-gray-600 whitespace-pre-line">{card.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {committees.map((comm) => (
              <div key={comm.id} className={`bg-white p-6 rounded-3xl border-t-8 ${comm.color || 'border-emerald-900'} shadow-lg`}>
                <h3 className="font-bold text-emerald-900 text-sm uppercase mb-1 tracking-wider">{comm.title}</h3>
                <p className="text-[0.65rem] text-gray-400 font-bold mb-4 uppercase">{comm.team}</p>
                {comm.tasks?.map((t, i) => (<div key={i} className="flex gap-3 text-[0.7rem] text-gray-600 bg-gray-50 p-3 mb-2 rounded-xl border">{t}</div>))}
              </div>
            ))}
          </div>
        )}

        <footer className="mt-20 border-t pt-10 text-center flex flex-col items-center gap-4">
           {isAdmin && (
              <button onClick={() => setView('admin')} className="text-emerald-800 font-bold uppercase text-[10px] bg-emerald-50 px-8 py-3 rounded-full border border-emerald-100 shadow-sm transition-all">Open Master Dashboard</button>
           )}
           <button onClick={() => setShowPasscodeModal(true)} className="text-gray-100 hover:text-emerald-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
           </button>
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