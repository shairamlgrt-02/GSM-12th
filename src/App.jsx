import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';

export default function ChurchPortal() {
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
  const [siteContent, setSiteContent] = useState({
    mainTitle: 'God of Restoration',
    subTitle: 'REBUILD • REVIVE • REIGN',
    verse: '"And to the masons, and hewers of stone..." — 2 Kings 12:12'
  });
  const [visionPillars, setVisionPillars] = useState([
    { id: 'p1', title: '1. Glorifying God', desc: 'Every aesthetic and program element points back to Him.' },
    { id: 'p2', title: '2. Highlighting His Name', desc: 'Making His presence the absolute focal point of the day.' },
    { id: 'p3', title: '3. God’s Faithfulness', desc: 'Space for the congregation to reflect on His provision.' },
    { id: 'p4', title: '4. Exaltation through History', desc: "Acknowledging His hand in GSM's 12-year journey." }
  ]);

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);

    // Listen to Site Text
    const unsubSite = onSnapshot(doc(db, 'site', 'content'), (snap) => {
      if (snap.exists()) setSiteContent(snap.data());
    });

    // Listen to Vision Pillars
    const unsubVision = onSnapshot(collection(db, 'visionPillars'), (snap) => {
      if (!snap.empty) {
        const pillars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVisionPillars(pillars.sort((a, b) => a.id.localeCompare(b.id)));
      }
    });

    const unsubProg = onSnapshot(query(collection(db, 'program'), orderBy('time')), (snap) => {
      if (!snap.empty) setProgram(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubComm = onSnapshot(collection(db, 'committees'), (snap) => {
      if (!snap.empty) setCommittees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCat = onSnapshot(collection(db, 'catering'), (snap) => {
      if (!snap.empty) setCatering(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSite(); unsubVision(); unsubProg(); unsubComm(); unsubCat(); };
  }, []);

  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === SECRET_CODE) {
      setIsAdmin(true);
      setShowPasscodeModal(false);
      localStorage.setItem('gsm_admin', 'true');
    } else {
      alert('Incorrect Code');
    }
  };

  const updateDocField = async (col, id, field, value) => {
    await updateDoc(doc(db, col, id), { [field]: value });
  };

  const updateSiteContent = async (field, value) => {
    await setDoc(doc(db, 'site', 'content'), { [field]: value }, { merge: true });
  };

  // --- MAP LOGIC ---
  const renderServiceDots = () => {
    const dots = [];
    const drawBlock = (startX, startY, cols, rows, isLead) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push(<div key={`dot-${startX}-${startY}-${r}-${c}`} className={`absolute w-2 h-2 rounded-sm border z-20 ${isLead ? 'bg-[#fef08a] border-[#854d0e]' : 'bg-[#86efac] border-[#166534]'}`} style={{ left: `${startX + c * 2.8}%`, top: `${startY + r * 4.2}%` }} />);
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

  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D]">
      {/* 1. ADMIN BACKEND */}
      {isAdmin && (
        <div className="fixed inset-0 z-[200] bg-gray-50 overflow-y-auto p-4 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
              <h2 className="text-2xl font-serif text-emerald-900 font-bold italic">GSM Backend</h2>
              <button onClick={() => { setIsAdmin(false); localStorage.removeItem('gsm_admin'); }} className="bg-red-500 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Close Dashboard</button>
            </div>

            <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
              {['settings', 'vision', 'program', 'committees', 'logistics'].map((t) => (
                <button key={t} onClick={() => setAdminActiveTab(t)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${adminActiveTab === t ? 'bg-emerald-900 text-white' : 'text-gray-400'}`}>{t}</button>
              ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {adminActiveTab === 'settings' && (
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase">Main Title</label><input className="w-full p-2 bg-gray-50 rounded border text-sm" defaultValue={siteContent.mainTitle} onBlur={(e) => updateSiteContent('mainTitle', e.target.value)} /></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase">Sub Title</label><input className="w-full p-2 bg-gray-50 rounded border text-sm" defaultValue={siteContent.subTitle} onBlur={(e) => updateSiteContent('subTitle', e.target.value)} /></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase">Bible Verse</label><textarea className="w-full p-2 bg-gray-50 rounded border text-sm h-20" defaultValue={siteContent.verse} onBlur={(e) => updateSiteContent('verse', e.target.value)} /></div>
                </div>
              )}
              {adminActiveTab === 'vision' && (
                <div className="grid grid-cols-1 gap-4">
                  {visionPillars.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl border shadow-sm">
                      <input className="font-bold text-emerald-900 w-full mb-2 outline-none border-b border-dashed" defaultValue={p.title} onBlur={(e) => updateDocField('visionPillars', p.id, 'title', e.target.value)} />
                      <textarea className="w-full text-xs text-gray-500 h-16 outline-none" defaultValue={p.desc} onBlur={(e) => updateDocField('visionPillars', p.id, 'desc', e.target.value)} />
                    </div>
                  ))}
                </div>
              )}
              {adminActiveTab === 'program' && (
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
                  {program.map((item) => (
                    <div key={item.id} className="flex gap-4 border-b pb-4"><span className="text-[10px] font-bold w-16">{item.time}</span><input className="flex-1 p-2 bg-gray-50 rounded text-xs outline-none" defaultValue={item.activity} onBlur={(e) => updateDocField('program', item.id, 'activity', e.target.value)} /></div>
                  ))}
                </div>
              )}
              {adminActiveTab === 'committees' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {committees.map((comm) => (
                    <div key={comm.id} className="bg-white p-6 rounded-3xl border shadow-sm border-t-8 border-emerald-900">
                      <p className="font-bold text-xs mb-4 uppercase">{comm.title}</p>
                      {comm.tasks?.map((task, idx) => (
                        <textarea key={idx} className="w-full text-[10px] p-2 mb-2 rounded border h-16 resize-none" defaultValue={task} onBlur={(e) => {
                          const newTasks = [...comm.tasks]; newTasks[idx] = e.target.value; updateDocField('committees', comm.id, 'tasks', newTasks);
                        }} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {adminActiveTab === 'logistics' && (
                <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
                  {catering.map((cat) => (
                    <div key={cat.id} className="flex justify-between items-center border-b pb-2"><label className="text-[10px] font-bold uppercase text-gray-400">{cat.group}</label><input className="text-sm font-bold text-right outline-none bg-gray-50 p-2 rounded" defaultValue={cat.dish} onBlur={(e) => updateDocField('catering', cat.id, 'dish', e.target.value)} /></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PUBLIC FRONTEND */}
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-2 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter flex-shrink-0 w-[20%]">GSM <span className="font-light italic text-[#C5A021]">12th</span></div>
        <div className="flex justify-between items-center w-[80%] pr-1 md:pr-0">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-[6.5px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-all border-b-2 py-1 whitespace-nowrap ${activeTab === tab ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-gray-400'}`}>
              {tab === 'floor' ? 'Map' : tab === 'checklist' ? 'Committees' : tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif text-emerald-900 mb-2 italic leading-tight">{siteContent.mainTitle}</h1>
          <p className="text-[#C5A021] font-bold tracking-[0.3em] text-xs md:text-sm mb-4 uppercase">{siteContent.subTitle}</p>
          <p className="text-emerald-800 font-serif italic text-xl md:text-2xl opacity-80 whitespace-pre-line">{siteContent.verse}</p>
        </div>

        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
            <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-serif mb-8 text-[#C5A021]">The 4 Spiritual Pillars</h2>
              <div className="space-y-8">
                {visionPillars.map((p, i) => (
                  <div key={i} className="border-l-2 border-[#C5A021] pl-6"><h4 className="font-bold uppercase tracking-widest text-xs mb-2 text-[#C5A021]">{p.title}</h4><p className="text-gray-300 text-sm leading-relaxed">{p.desc}</p></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-900"><h3 className="font-serif text-xl mb-2 italic">Rebuild (Act I)</h3><p className="text-sm text-gray-600">Reflection and foundation. Stripped back acoustic opening.</p></div>
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-600"><h3 className="font-serif text-xl mb-2 italic">Revive (Act II)</h3><p className="text-sm text-gray-600">Awakening and praise. Restoration Wall interactive activity.</p></div>
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-[#C5A021]"><h3 className="font-serif text-xl mb-2 italic">Reign (Act III)</h3><p className="text-sm text-gray-600">Fellowship and leader ordination. Transition to Banquet.</p></div>
            </div>
          </div>
        )}

        {activeTab === 'floor' && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <h3 className="font-bold text-emerald-900 uppercase text-xs tracking-widest">Blueprint: Spatial Engineering v3.3</h3>
              <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">{isBanquet ? 'Return to Service Seating' : 'Activate Banquet Layout'}</button>
            </div>
            <div className="relative w-full aspect-[1.4/1] border-[6px] border-[#2D2D2D] bg-white overflow-hidden mx-auto max-w-[900px] rounded-sm">
               {!isBanquet ? (
                 <><div className="absolute border border-black z-10 flex items-center justify-center font-black text-[0.5rem] md:text-[0.65rem] uppercase bg-white/50" style={{top: '12.5%', left: '19.5%', width: '53.5%', height: '38.5%'}}>Main Hall</div><div className="absolute border border-black border-l-dashed z-10 flex items-center justify-center font-black text-[0.5rem] uppercase bg-[#fffcf0] text-orange-700" style={{top: '12.5%', left: '73%', width: '14%', height: '38.5%'}}>Overflow</div><div className="absolute border border-black bg-gray-100 z-10 flex items-center justify-center font-black text-[0.65rem] uppercase" style={{top: '12.5%', left: '87%', width: '10%', height: '38.5%'}}>Stage</div><div className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50" style={{left: '44%', top: '44%'}} /><div className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50" style={{left: '75%', top: '30%'}} />{renderServiceDots()}</>
               ) : renderBanquetLayout()}
            </div>
          </div>
        )}

        {activeTab === 'program' && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl">
            <div className="p-8 bg-emerald-900 text-white flex justify-between items-center"><h3 className="font-serif text-2xl italic">Minute-by-Minute Program Flow</h3><span className="text-xs font-black uppercase tracking-widest text-[#C5A021]">May 29, 2026</span></div>
            <table className="w-full text-left"><tbody className="text-[0.8rem] md:text-sm divide-y divide-gray-50">
              {program.map((row, i) => (
                <tr key={i} className={`${row.style} transition-colors hover:bg-gray-50/50`}><td className="p-5 font-bold w-24 md:w-32 border-r">{row.time}</td><td className="p-5">{row.activity}</td></tr>
              ))}
            </tbody></table>
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-3xl text-emerald-900 mb-8 italic underline decoration-[#C5A021]">7-Group Catering Matrix</h3>
              <div className="space-y-3">
                {catering.map((item, i) => (
                  <div key={i} className={`flex justify-between items-center p-4 rounded-xl border ${item.confirmed ? 'bg-[#fffcf0] border-orange-100' : 'bg-gray-50 border-gray-100'}`}><span className="text-gray-700 font-medium">{item.group}</span><span className={`font-bold ${item.confirmed ? 'text-orange-800' : 'text-gray-400 italic text-xs'}`}>{item.dish}</span></div>
                ))}
                <div className="flex justify-between items-center p-5 bg-emerald-900 text-white rounded-xl shadow-md mt-4 font-bold"><span>Church</span><span className="italic text-emerald-200 text-xs">To be confirmed</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-emerald-800"><h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">Transport Matrix (Sis Bhing)</h4><p className="text-sm font-medium">Routes: Burhama, Sanabis, Gudabiya. Lock by May 15. Arrival by 1:00 PM strict.</p></div>
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-[#fef08a]"><h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">Committee Contribution</h4><p className="text-sm font-medium">BD 5.000 (Committee) / BD 3.500 (Shirt - Bhim/Deon). Deadline: May 15.</p></div>
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-slate-400"><h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">Stage Pledge</h4><p className="text-sm font-medium">BD 100.000 for Stage Deco (Pastor Benny). Setup: May 28.</p></div>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {committees.map((comm, i) => (
              <div key={i} className={`bg-white p-6 rounded-3xl border-t-8 ${comm.color} shadow-lg`}><h3 className="font-bold text-emerald-900 text-sm uppercase mb-1 tracking-wider">{comm.title}</h3><p className="text-[0.65rem] text-gray-400 font-bold uppercase mb-4">{comm.team}</p><div className="space-y-3">{comm.tasks?.map((task, j) => (
                <div key={j} className="flex gap-3 items-start text-[0.7rem] leading-tight text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100"><div className="w-4 h-4 border-2 border-[#C5A021] rounded bg-white flex-shrink-0 mt-0.5" />{task}</div>
              ))}</div></div>
            ))}
          </div>
        )}

        <footer className="mt-20 border-t border-gray-100 pt-10 text-center">
          <button onClick={() => setShowPasscodeModal(true)} className="text-gray-100 hover:text-emerald-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>
        </footer>

        {showPasscodeModal && (
          <div className="fixed inset-0 z-[300] bg-emerald-900/95 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white p-10 rounded-3xl w-full max-w-xs shadow-2xl text-center">
              <form onSubmit={handlePasscode} className="space-y-4"><h2 className="font-serif text-2xl mb-4 italic text-emerald-900">Enter Access Code</h2><input type="password" autoFocus className="w-full text-center text-2xl p-4 bg-gray-50 rounded-xl border outline-none font-bold" onChange={(e) => setPasscodeInput(e.target.value)} /><button className="w-full bg-emerald-900 text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg">Verify Backend Access</button><button type="button" onClick={() => setShowPasscodeModal(false)} className="w-full text-gray-400 text-[10px] font-bold uppercase">Cancel</button></form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}