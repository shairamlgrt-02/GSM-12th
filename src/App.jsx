import React, { useState, useEffect } from 'react';
import { Settings, LayoutDashboard, LogIn, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, GripVertical, Plus } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, addDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import MapRenderer from './components/MapRenderer';
import HomeBlockRenderer from './components/HomeBlockRenderer';
import VisionSection from './components/VisionSection';
import RegistrationSection from './components/RegistrationSection';
import AdminDashboard from './components/AdminDashboard';
import PageBuilder from './components/PageBuilder';
import LivePage from './components/LivePage';

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const due = new Date(dateStr);
  return due < today;
};

export default function ChurchPortal() {
  // --- 1. ALL STATES MUST BE DECLARED FIRST ---
  const [view, setView] = useState('public');
  const [activeTab, setActiveTab] = useState('home');
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
  const [responses, setResponses] = useState([]);
  const [regSubTab, setRegSubTab] = useState('builder');
  const [visionActs, setVisionActs] = useState(() => {
    const saved = localStorage.getItem('gsm_vision_cache');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [internalSubTab, setInternalSubTab] = useState('logistics');

  const SECRET_CODE = 'GSM2026';

  // --- 2. FUNCTIONS SECOND ---
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);

    // We update the URL to ?page=tabName
    // This allows the back button to work without breaking your ID links
    window.history.pushState({ tab: tabName }, '', `?page=${tabName}`);

    // If there is an ID in the URL, we still want to respect it
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');

    if (tabName === 'register' && forms.length > 0 && !idParam) {
      const firstVisibleForm = forms.find(f => f.isVisible) || forms[0];
      setActiveFormId(firstVisibleForm.id);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 3. EFFECTS THIRD ---

  // Listen for Browser Back/Forward Buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page') || 'home';
      const idParam = urlParams.get('id');

      // Update the main tab
      setActiveTab(pageParam);

      // Update the specific Form or Event if the ID is there
      if (pageParam === 'register' && idParam) {
        setActiveFormId(idParam);
      }
      if (pageParam === 'program' && idParam) {
        setActiveEventId(idParam);
        setActiveEventSubTab(idParam);
      }
    };

    // This is the "Live Feed" from the browser's back/forward buttons
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [forms, masterEvents]);

  // Handle Smart Link Landing on Load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const idParam = urlParams.get('id');

    if (pageParam) {
      setActiveTab(pageParam);
      if (pageParam === 'register' && idParam && forms.length > 0) {
        setActiveFormId(idParam);
      }
      if (pageParam === 'program' && idParam && masterEvents.length > 0) {
        setActiveEventId(idParam);
        setActiveEventSubTab(idParam);
      }
      if (pageParam === 'home' && idParam) {
        setTimeout(() => {
          const element = document.getElementById(idParam);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-4');
            setTimeout(() => element.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-4'), 2000);
          }
        }, 800);
      }
      // Logic for Map Sections
      if (pageParam === 'map' && idParam) {
        setTimeout(() => {
          const element = document.getElementById(idParam);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optional: Add a highlight effect
            element.classList.add('ring-4', 'ring-emerald-500/20', 'rounded-3xl');
            setTimeout(() => element.classList.remove('ring-4', 'ring-emerald-500/20'), 3000);
          }
        }, 800);
      }
    }
  }, [forms.length, masterEvents.length]);

  // Main Firebase Listeners
  useEffect(() => {
    if (localStorage.getItem('gsm_admin') === 'true') setIsAdmin(true);

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

    return () => {
      unsubContent(); unsubHome(); unsubForms(); unsubResponses(); unsubProgram();
      unsubCommittees(); unsubCatering(); unsubLogistics(); unsubEvents();
      unsubVision(); unsubMap();
    };
  }, []);

  // --- 4. DATA ACTIONS & FIREBASE HELPERS ---
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
      setIsAdmin(true);
      setView('admin');
      setShowPasscodeModal(false);
      localStorage.setItem('gsm_admin', 'true');
    } else {
      alert('Invalid Code');
    }
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
    handleTabChange('home'); // Using our new function to go back home
  };

  // --- 5. THE FINAL RETURN (Visuals) ---
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
        </div> {/* <--- This is the crucial closing div that was missing! */}


        {/* BOTTOM ROW: Uniform Gaps & Smart Wrapping */}
        <div className="bg-[#F4F1E8] border-b border-gray-200 py-0.5 md:py-0">
          <div className="flex flex-wrap justify-center items-center gap-x-4 md:gap-x-8 px-4 max-w-5xl mx-auto min-h-[32px] md:h-12">
            {['home', 'vision', 'program', 'register', 'map', 'planning-center'].map((t, i) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`text-[8px] md:text-[11px] font-black uppercase tracking-tighter transition-all px-1 py-2 md:h-full border-b-2 flex items-center whitespace-nowrap 
                  ${activeTab === t ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-400'}
                `}
              >
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="px-5 max-w-6xl mx-auto pb-35 pt-35 md:pt-35">

        <div className="mt-2">

          <LivePage
            isAdmin={isAdmin}
            activeTab={activeTab}
            appData={{
              mapObjects, isBanquet, siteContent, visionActs, homeBlocks, setActiveTab,
              masterEvents, program, logisticsCards, activeEventSubTab, setActiveEventSubTab, activeProgramId, setActiveProgramId,
              forms, activeFormId, setActiveFormId, submitResponse,
              isPrivateUnlocked, setIsPrivateUnlocked, passInput, setPassInput, internalSubTab, setInternalSubTab, catering, committees, updateField, isOverdue
            }}
          />



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