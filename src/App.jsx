import React, { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, LogIn, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, GripVertical, Plus } from 'lucide-react'; import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, addDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import MapRenderer from './components/MapRenderer';
import HomeBlockRenderer from './components/HomeBlockRenderer';
import VisionSection from './components/VisionSection';
import RegistrationSection from './components/RegistrationSection';
import AdminDashboard from './components/AdminDashboard';

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const due = new Date(dateStr);
  return due < today;
};

export default function ChurchPortal() {
  const [view, setView] = useState('public');
  const [activeTab, setActiveTab] = useState('home');

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'register' && forms.length > 0) {
      const firstVisibleForm = forms.find(f => f.isVisible) || forms[0];
      setActiveFormId(firstVisibleForm.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [adminActiveTab, setAdminActiveTab] = useState('home');
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
  const [homeBlocks, setHomeBlocks] = useState([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [forms, setForms] = useState([]);
  const [activeFormId, setActiveFormId] = useState(null);

  useEffect(() => {
    if (activeTab === 'register' && forms.length > 0) {
      const firstVisibleForm = forms.find(f => f.isVisible) || forms[0];
      if (firstVisibleForm) {
        setActiveFormId(firstVisibleForm.id);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, forms]);

  const [responses, setResponses] = useState([]);
  const [regSubTab, setRegSubTab] = useState('builder');

  const [visionActs, setVisionActs] = useState(() => {
    const saved = localStorage.getItem('gsm_vision_cache');
    return saved ? JSON.parse(saved) : [];
  });

  // FIXED: Added missing states for Planning Center
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [internalSubTab, setInternalSubTab] = useState('logistics');

  const SECRET_CODE = 'GSM2026';

  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);

    // We are putting a "handle" (like unsubContent) on each faucet so we can turn it off later.
    const unsubContent = onSnapshot(doc(db, 'site', 'content'), (snap) => snap.exists() && setSiteContent(snap.data()));

    const unsubHome = onSnapshot(query(collection(db, 'homeBlocks'), orderBy('order', 'asc')), (snap) => {
      setHomeBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubForms = onSnapshot(query(collection(db, 'forms'), orderBy('createdAt', 'desc')), (snap) => {
      setForms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubResponses = onSnapshot(collection(db, 'responses'), (snap) => {
      setResponses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProgram = onSnapshot(query(collection(db, 'program'), orderBy('order', 'asc')), (snap) => {
      setProgram(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCommittees = onSnapshot(collection(db, 'committees'), (snap) => setCommittees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubCatering = onSnapshot(collection(db, 'catering'), (snap) => setCatering(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubLogistics = onSnapshot(collection(db, 'logisticsCards'), (snap) => setLogisticsCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubEvents = onSnapshot(query(collection(db, 'masterEvents'), orderBy('rank', 'asc')), (snap) => {
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMasterEvents(events);

      const visibleEvents = events.filter(e => e.isActive !== false);
      if (visibleEvents.length > 0 && !activeEventSubTab) setActiveEventSubTab(visibleEvents[0].id);
      if (events.length > 0 && !activeEventId) setActiveEventId(events[0].id);
    });

    const unsubVision = onSnapshot(collection(db, 'visionActs'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisionActs(data);
      localStorage.setItem('gsm_vision_cache', JSON.stringify(data));
    });

    const unsubMap = onSnapshot(collection(db, 'mapObjects'), (snap) => setMapObjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // This is the master shut-off valve! It runs when the user leaves the page.
    return () => {
      unsubContent();
      unsubHome();
      unsubForms();
      unsubResponses();
      unsubProgram();
      unsubCommittees();
      unsubCatering();
      unsubLogistics();
      unsubEvents();
      unsubVision();
      unsubMap();
    };
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

  const addHomeBlock = async (type) => {
    const newOrder = homeBlocks.length > 0 ? Math.max(...homeBlocks.map(b => b.order || 0)) + 1 : 0;
    const blockData = {
      type,
      order: newOrder,
      title: type.toUpperCase() + ' SECTION',
      content: '',
      imageUrl: '',
      linkTo: '',
      isActive: true,
      items: []
    };
    if (type === 'grid') {
      blockData.items = [
        { id: Date.now() + 1, title: 'Card 1', desc: '', imageUrl: '' },
        { id: Date.now() + 2, title: 'Card 2', desc: '', imageUrl: '' },
        { id: Date.now() + 3, title: 'Card 3', desc: '', imageUrl: '' }
      ];
    }
    await addDoc(collection(db, 'homeBlocks'), blockData);
  };

  const moveHomeBlock = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= homeBlocks.length) return;
    const batch = writeBatch(db);
    batch.update(doc(db, 'homeBlocks', homeBlocks[index].id), { order: targetIndex });
    batch.update(doc(db, 'homeBlocks', homeBlocks[targetIndex].id), { order: index });
    await batch.commit();
  };

  const createNewForm = async () => {
    const docRef = await addDoc(collection(db, 'forms'), {
      title: 'New Event Form',
      isVisible: false,
      createdAt: new Date().toISOString(),
      fields: []
    });
    setActiveFormId(docRef.id);
  };

  const updateFormFields = async (formId, newFields) => {
    await updateDoc(doc(db, 'forms', formId), { fields: newFields });
  };
  const onQuestionDragStart = (e, index) => {
    e.dataTransfer.setData('draggedIndex', index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onQuestionDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onQuestionDrop = async (e, targetIndex, formId) => {
    e.preventDefault();
    const draggedIndex = e.dataTransfer.getData('draggedIndex');
    if (draggedIndex === "" || parseInt(draggedIndex) === targetIndex) return;
    const currentForm = forms.find(f => f.id === formId);
    let newFields = [...currentForm.fields];
    const draggedItem = newFields[parseInt(draggedIndex)];
    newFields.splice(parseInt(draggedIndex), 1);
    newFields.splice(targetIndex, 0, draggedItem);
    await updateFormFields(formId, newFields);
  };

  const submitResponse = async (formData) => {
    await addDoc(collection(db, 'responses'), {
      ...formData,
      submittedAt: new Date().toISOString(),
      status: 'Pending'
    });
    alert('Registration Submitted Successfully!');
    setActiveTab('home');
  };

  if (view === 'admin') {
    return (
      <AdminDashboard
        setView={setView} handleLogout={handleLogout} adminActiveTab={adminActiveTab} setAdminActiveTab={setAdminActiveTab}
        siteContent={siteContent} updateSite={updateSite} homeBlocks={homeBlocks} addHomeBlock={addHomeBlock}
        moveHomeBlock={moveHomeBlock} updateField={updateField} removeItem={removeItem} visionActs={visionActs}
        addItem={addItem} mapObjects={mapObjects} isBanquet={isBanquet} setIsBanquet={setIsBanquet}
        masterEvents={masterEvents} activeEventId={activeEventId} setActiveEventId={setActiveEventId}
        activeEventSubTab={activeEventSubTab} setActiveEventSubTab={setActiveEventSubTab} moveRank={moveRank}
        program={program} activeProgramId={activeProgramId} setActiveProgramId={setActiveProgramId}
        insertItemAt={insertItemAt} onDragStart={onDragStart} onDragOver={onDragOver} catering={catering}
        logisticsCards={logisticsCards} committees={committees} forms={forms} activeFormId={activeFormId}
        setActiveFormId={setActiveFormId} createNewForm={createNewForm} updateFormFields={updateFormFields}
        onQuestionDragStart={onQuestionDragStart} onQuestionDragOver={onQuestionDragOver} onQuestionDrop={onQuestionDrop}
        responses={responses} regSubTab={regSubTab} setRegSubTab={setRegSubTab}
      />
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
      <nav className="fixed w-full z-50 shadow-sm top-0">
        {/* TOP ROW: Branding and Login */}
        <div className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <div className="flex-1">
            <div className="font-bold text-emerald-900 text-[10px] md:text-sm tracking-tighter uppercase whitespace-nowrap">
              GSM <span className="font-light italic text-[#C5A021]">12th Anniversary</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={() => isAdmin ? setView('admin') : setShowPasscodeModal(true)}
              className="bg-emerald-50 text-emerald-900 p-2 rounded-full border border-emerald-100 shadow-sm active:scale-95 transition-all"
            >
              <LogIn size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: Uniform Gaps & Smart Wrapping */}
        <div className="bg-[#F4F1E8] border-b border-gray-200 py-0.5 md:py-0">
          <div className="flex flex-wrap justify-center items-center gap-x-4 md:gap-x-8 px-4 max-w-5xl mx-auto min-h-[32px] md:h-12">
            {['home', 'vision', 'program', 'register', 'map', 'planning-center'].map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-[8px] md:text-[11px] font-black uppercase tracking-tighter transition-all px-1 py-2 md:h-full border-b-2 flex items-center whitespace-nowrap 
          ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-400'}
        `}
              >
                {/* Replaces hyphens with spaces for the display label */}
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="px-5 max-w-6xl mx-auto pb-35 pt-35 md:pt-35">
        {activeTab === 'home' && siteContent && (
          <header className="text-center mb-4 animate-in fade-in duration-1000">
            <h1 className="text-4xl md:text-7xl font-serif text-emerald-900 mb-2 italic tracking-tight">
              {siteContent.mainTitle}
            </h1>
            <p className="text-[#C5A021] font-bold tracking-[0.25em] text-[10px] md:text-sm mb-4 uppercase">
              {siteContent.subTitle}
            </p>
            <div className="max-w-xs md:max-w-3xl mx-auto border-y border-emerald-900/10 py-3">
              <p className="text-emerald-800 font-serif italic opacity-75 leading-relaxed text-[13px] md:text-lg">
                {siteContent.verse}
              </p>
            </div>
          </header>
        )}
        <div className="mt-2">

          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in pt-0">
              {homeBlocks.length > 0 ? (
                homeBlocks.map(block => (
                  <HomeBlockRenderer key={block.id} block={block} setActiveTab={setActiveTab} />
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <img src="https://i.ibb.co/5Q0nkvG/GSM-Logo-with-White.png" alt="Logo" className="w-16 mx-auto mb-4" />
                  <p className="font-serif italic text-xl">The journey begins soon...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vision' && (
            <VisionSection siteContent={siteContent} visionActs={visionActs} />
          )}

          {activeTab === 'map' && (
            <div className="animate-in fade-in pt-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 className="font-bold text-emerald-900 uppercase text-[10px] tracking-widest italic opacity-40">{siteContent.mapHeader || 'Hall Layout Architect'}</h3>
                <button onClick={() => setIsBanquet(!isBanquet)} className="bg-emerald-900 text-white px-8 py-2 rounded-xl text-[10px] font-bold uppercase shadow-lg active:scale-95 transition-all">{isBanquet ? 'Switch Layout: Service' : 'Switch Layout: Banquet'}</button>
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-xl p-3 mb-8 shadow-sm overflow-x-auto no-scrollbar gap-8">
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-2.5 border border-black bg-white" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendRooms || 'Rooms'}</span></div>
                <div className="flex items-center gap-1.5"><div className="flex gap-0.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /></div><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendSeating || 'Seating'}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-md" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendEntry || 'Circle'}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-2.5 bg-orange-400 border border-orange-600 rounded-sm" /><span className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-900">{siteContent.legendBanquet || 'Tables'}</span></div>
              </div>
              <MapRenderer mode={isBanquet ? 'banquet' : 'service'} mapObjects={mapObjects} />
            </div>
          )}

          {activeTab === 'program' && (
            <div className="animate-in fade-in pt-0">
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

          {activeTab === 'register' && (
            <RegistrationSection forms={forms} activeFormId={activeFormId} setActiveFormId={setActiveFormId} submitResponse={submitResponse} />
          )}

          {activeTab === 'planning-center' && (
            <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in duration-700">
              {!isPrivateUnlocked ? (
                /* PRIVATE LOGIN GATE */
                <div className="max-w-md mx-auto mt-10">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-900/5 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                      <svg className="w-10 h-10 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="font-serif italic text-2xl text-emerald-900 mb-2">Planning Center</h2>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-10">Secure Committee & Logistics Portal</p>
                    <div className="space-y-4">
                      <input
                        type="password"
                        autoFocus
                        className="w-full bg-slate-50 border border-transparent focus:border-emerald-100 rounded-2xl px-6 py-4 text-center text-emerald-900 tracking-[0.3em] outline-none transition-all"
                        placeholder="••••••••"
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (passInput === 'GSM2026') {
                              setIsPrivateUnlocked(true);
                            } else {
                              alert("Invalid Access Code");
                              setPassInput('');
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (passInput === 'GSM2026') {
                            setIsPrivateUnlocked(true);
                          } else {
                            alert("Invalid Access Code");
                            setPassInput('');
                          }
                        }}
                        className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 transition-all active:scale-95"
                      >
                        Verify Access
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* UNLOCKED PLANNING CENTER DASHBOARD */
                <div className="animate-in slide-in-from-bottom-6 duration-500">

                  {/* SUB-NAV: Swapping between Logistics and Committees */}
                  <div className="flex bg-emerald-900/5 p-1 rounded-xl gap-2 shadow-inner mb-10 max-w-lg mx-auto">
                    <button
                      onClick={() => setInternalSubTab('logistics')}
                      className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'logistics' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                    >
                      Logistics
                    </button>
                    <button
                      onClick={() => setInternalSubTab('committees')}
                      className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'committees' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                    >
                      Committees
                    </button>
                  </div>

                  {/* LOGISTICS CONTENT (Default View) */}
                  {(internalSubTab === 'logistics' || !internalSubTab) && (
                    <div className="animate-in fade-in pt-0 space-y-6">
                      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-fit">
                        <div className="bg-emerald-900 p-4">
                          <h3 className="font-serif italic text-white text-lg tracking-tight leading-none text-center">
                            {siteContent?.cateringHeader || 'Food Contribution'}
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {catering.map((item, i) => (
                            <div key={i} className="p-4 hover:bg-slate-50 transition-all flex flex-col gap-1 text-left">
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
                      <div className="space-y-4 text-left">
                        {logisticsCards.filter(card => !card.parentId).map(card => (
                          <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-100 border-l-[6px] border-emerald-900 shadow-sm hover:shadow-md transition-all duration-500">
                            <h4 className="font-black text-emerald-900 uppercase text-[9px] mb-2 tracking-widest italic opacity-40">{card.title}</h4>
                            <p className="text-[11px] md:text-sm text-slate-600 leading-relaxed font-bold tracking-tight whitespace-pre-line">{card.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COMMITTEES CONTENT */}
                  {internalSubTab === 'committees' && (
                    <div className="animate-in fade-in pt-0 space-y-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-end mb-1">
                          <h3 className="font-black text-emerald-900 text-[9px] uppercase tracking-widest italic opacity-40">Event Readiness</h3>
                          <span className="font-serif italic text-emerald-900 text-3xl tracking-tighter">
                            {Math.round((committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border shadow-inner">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-1000"
                            style={{ width: `${(committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0) / (committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        {committees.map((comm) => (
                          <div key={comm.id} className="bg-white p-5 rounded-xl border border-slate-100 border-t-4 border-emerald-900 shadow-sm group hover:shadow-md transition-all duration-500">
                            <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-tighter mb-4">{comm.title}</h3>
                            <div className="space-y-2">
                              {comm.tasks?.map((t, i) => {
                                const overdue = !t.completed && isOverdue(t.dueDate);
                                return (
                                  <div key={i} className={`p-3 rounded-lg border border-slate-50 transition-all duration-500 ${t.completed ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm'}`}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="mt-0.5 accent-emerald-600 w-3.5 h-3.5 rounded"
                                        checked={t.completed || false}
                                        onChange={async () => {
                                          const nt = [...comm.tasks];
                                          nt[i].completed = !nt[i].completed;
                                          await updateField('committees', comm.id, { tasks: nt });
                                        }}
                                      />
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
                </div>
              )}
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
        </div>
      </main>
    </div>
  );
}