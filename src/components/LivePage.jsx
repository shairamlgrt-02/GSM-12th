import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 1. IMPORT YOUR CUSTOM COMPONENTS
import MapRenderer from './MapRenderer';
import VisionSection from './VisionSection';
import HomeBlockRenderer from './HomeBlockRenderer';
import RegistrationSection from './RegistrationSection';

// 2. CREATE THE DATA TUNNEL
export const AppDataContext = createContext();

// 3. CREATE THE DRAGGABLE MAP BLOCK
const MapBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  // Pull the map data out of the tunnel!
  const { mapObjects, isBanquet } = useContext(AppDataContext) || { mapObjects: [], isBanquet: false };

  return (
    <div
      ref={(ref) => enabled ? connect(drag(ref)) : null}
      className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-blue-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-blue-500 z-10' : ''}`}
    >
      {enabled && <span className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Map Component</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>
        <MapRenderer mode={isBanquet ? 'banquet' : 'service'} mapObjects={mapObjects} />
      </div>
    </div>
  );
};
MapBlock.craft = { rules: { canDrag: () => true } };


// 4. CREATE THE DRAGGABLE VISION BLOCK
const VisionBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  // Pull the vision data and site content out of the tunnel!
  const { siteContent, visionActs } = useContext(AppDataContext) || { siteContent: {}, visionActs: [] };

  return (
    <div
      ref={(ref) => enabled ? connect(drag(ref)) : null}
      className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-indigo-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-indigo-500 z-10' : ''}`}
    >
      {enabled && <span className="absolute top-0 left-0 bg-indigo-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Vision Section</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>
        <VisionSection siteContent={siteContent} visionActs={visionActs} />
      </div>
    </div>
  );
};
VisionBlock.craft = { rules: { canDrag: () => true } };


// 5. CREATE THE SITE HEADER BLOCK
const SiteHeaderBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { siteContent } = useContext(AppDataContext) || { siteContent: {} };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-pink-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-pink-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-pink-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Site Header</span>}
      <header className={`text-center mb-4 ${enabled ? 'pointer-events-none' : ''}`}>
        <h1 className="text-4xl md:text-7xl font-serif text-emerald-900 mb-2 italic tracking-tight">{siteContent.mainTitle || 'Main Title'}</h1>
        <p className="text-[#C5A021] font-bold tracking-[0.25em] text-[10px] md:text-sm mb-4 uppercase">{siteContent.subTitle || 'Subtitle'}</p>
        <div className="max-w-xs md:max-w-3xl mx-auto border-y border-emerald-900/10 py-3">
          <p className="text-emerald-800 font-serif italic opacity-75 leading-relaxed text-[13px] md:text-lg">{siteContent.verse || 'Verse goes here...'}</p>
        </div>
      </header>
    </div>
  );
};
SiteHeaderBlock.craft = { rules: { canDrag: () => true } };

// 6. CREATE THE COUNTDOWN & WIDGETS BLOCK
const HomeWidgetsBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { homeBlocks, setActiveTab } = useContext(AppDataContext) || { homeBlocks: [] };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-amber-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-amber-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-amber-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Home Widgets (Countdown)</span>}
      <div className={`space-y-8 ${enabled ? 'pointer-events-none' : ''}`}>
        {homeBlocks && homeBlocks.length > 0 ? (
          homeBlocks.map(block => <HomeBlockRenderer key={block.id} block={block} setActiveTab={setActiveTab} />)
        ) : (
          <div className="text-center py-10 opacity-40"><p className="font-serif italic text-xl">Loading widgets...</p></div>
        )}
      </div>
    </div>
  );
};
HomeWidgetsBlock.craft = { rules: { canDrag: () => true } };


// 7. CREATE THE PROGRAM BLOCK
const ProgramBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { masterEvents, program, logisticsCards, activeEventSubTab, setActiveEventSubTab, activeProgramId, setActiveProgramId } = useContext(AppDataContext) || { masterEvents: [], program: [], logisticsCards: [] };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-cyan-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-cyan-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-cyan-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Program & Itinerary</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>

        <div className="flex flex-wrap bg-emerald-900/5 p-1 rounded-xl gap-2 shadow-inner mb-4">
          {masterEvents && masterEvents.filter(e => e.isActive !== false).map(ev => (
            <button
              key={ev.id}
              onClick={() => setActiveEventSubTab && setActiveEventSubTab(ev.id)}
              className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${activeEventSubTab === ev.id ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
            >
              {ev.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-4">
          <div className="p-4 bg-emerald-900 text-white text-center"><h3 className="font-serif text-lg italic tracking-tight">{masterEvents && masterEvents.find(e => e.id === activeEventSubTab)?.programHeader || 'Itinerary'}</h3></div>
          <div className="divide-y divide-slate-50">
            {program && program.filter(item => item.parentId === activeEventSubTab).map(row => (
              <div key={row.id}>
                <div onClick={() => setActiveProgramId && setActiveProgramId(activeProgramId === row.id ? null : row.id)} className="flex items-center p-3 md:p-4 cursor-pointer hover:bg-slate-50 transition-all">
                  <div className="w-14 md:w-24 font-bold text-[9px] md:text-[10px] text-emerald-800 uppercase tracking-tighter shrink-0">{row.time}</div>
                  <div className="flex-1">
                    <div className="font-bold text-[10px] md:text-sm text-slate-700 leading-tight tracking-tight">{row.activity}</div>
                    {row.remarks && <div className="text-[8px] md:text-[9px] text-emerald-600 italic font-semibold mt-0.5 md:mt-0">— {row.remarks}</div>}
                  </div>
                </div>
                {activeProgramId === row.id && row.description && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 bg-slate-50/50 text-[9px] md:text-[10px] text-slate-500 pl-16 md:pl-28 animate-in fade-in leading-relaxed font-medium">{row.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {logisticsCards && logisticsCards.filter(c => c.parentId === activeEventSubTab).map(card => (
            <div key={card.id} className="bg-white p-3.5 md:p-5 rounded-lg md:rounded-xl border border-slate-100 border-t-[4px] border-[#C5A021] shadow-sm">
              <h4 className="font-bold text-emerald-900 uppercase text-[8px] md:text-[9px] mb-1 md:mb-2 tracking-widest italic opacity-40">{card.title}</h4>
              <p className="text-[10px] md:text-[11px] text-gray-600 leading-relaxed font-medium whitespace-pre-line tracking-tight">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
ProgramBlock.craft = { rules: { canDrag: () => true } };

// 8. CREATE THE REGISTRATION BLOCK
const RegistrationBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { forms, activeFormId, setActiveFormId, submitResponse } = useContext(AppDataContext) || {};

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-rose-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-rose-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-rose-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Registration Area</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>
        {forms ? (
          <RegistrationSection forms={forms} activeFormId={activeFormId} setActiveFormId={setActiveFormId} submitResponse={submitResponse} />
        ) : (
          <div className="text-center py-10 opacity-40">Loading registration...</div>
        )}
      </div>
    </div>
  );
};
RegistrationBlock.craft = { rules: { canDrag: () => true } };


// 9. CREATE THE TABS BLOCK
// --- 1. THE DROP ZONE (Inside each tab) ---
// This is the container for the actual content blocks like Planning Center.
const TabDropZone = ({ children }) => {
  const { connectors: { connect } } = useNode();
  return (
    // We removed forced white background here so only the blocks dropped inside define the look
    <div ref={connect} className="min-h-[150px] w-full transition-all">
      {children ? children : (
        /* Styled placeholder for an empty tab */
        <div className="text-center text-slate-400 text-xs py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
          Drag blocks here...
        </div>
      )}
    </div>
  );
};
TabDropZone.craft = { rules: { canDrag: () => false } };

// --- 2. THE SETTINGS (To add/rename tabs in the sidebar) ---
const TabsBlockSettings = () => {
  const { actions: { setProp }, tabs } = useNode((node) => ({
    tabs: node.data.props.tabs
  }));

  const addTab = () => setProp(props => props.tabs.push({ id: `tab_${Date.now()}`, label: 'New Tab' }));
  const updateTab = (index, val) => setProp(props => props.tabs[index].label = val);
  const removeTab = (index) => setProp(props => {
    if (props.tabs.length > 1) props.tabs.splice(index, 1);
    else alert("You must have at least one tab!");
  });

  return (
    <div className="space-y-4 p-4 text-left" style={{ backgroundColor: '#1e293b', borderTop: '1px solid #334155' }}>
      <h3 className="text-xs font-black text-white uppercase tracking-widest">Manage Tabs</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
        {tabs.map((tab, i) => (
          <div key={tab.id} className="flex gap-2 items-center p-2 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <input
              type="text"
              value={tab.label}
              onChange={(e) => updateTab(i, e.target.value)}
              className="flex-1 bg-transparent text-white text-xs outline-none transition-colors font-bold"
              style={{ color: '#ffffff' }}
              onFocus={(e) => e.target.style.color = '#10b981'}
              onBlur={(e) => e.target.style.color = '#ffffff'}
            />
            <button onClick={() => removeTab(i)} className="text-rose-400 hover:text-rose-500 font-bold p-1 text-xs transition-colors">✕</button>
          </div>
        ))}
      </div>
      <button onClick={addTab} className="w-full py-2 border border-dashed rounded text-xs font-bold transition-colors" style={{ borderColor: '#334155', color: '#94a3b8' }}>
        + Add Tab
      </button>
    </div>
  );
};

// --- 3. THE MAIN TABS BLOCK ---
const TabsBlock = ({ tabs }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [activeTabId, setActiveTabId] = React.useState(tabs[0]?.id);

  // Safety check: if a tab is deleted, fallback to the first available tab
  const currentTabExists = tabs.find(t => t.id === activeTabId);
  const currentActiveTab = currentTabExists ? activeTabId : tabs[0]?.id;

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full max-w-5xl mx-auto my-8 transition-all ${enabled ? 'border-2 border-dashed border-emerald-400/9 py-4 min-h-[200px]' : ''} ${selected && enabled ? 'ring-4 ring-emerald-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-emerald-900 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Tabs Container</span>}

      {/* CHANGED: Container is now completely transparent (removed bg-white) */}
      <div className={`bg-transparent overflow-hidden ${enabled ? 'pointer-events-none' : ''}`}>

        {/* TAB NAVIGATION HEADER - Matched exact reference snippet */}
        <div className="flex justify-center mb-6 md:mb-10 w-full">
          <div className="flex bg-emerald-900/5 p-0.5 md:p-1 rounded-lg md:rounded-xl gap-0.5 md:gap-1 shadow-inner w-full max-w-2xl mx-auto overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex-1 px-3 py-1.5 md:px-5 md:py-2 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${currentActiveTab === tab.id
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-emerald-900/30 hover:text-emerald-900/80 hover:bg-emerald-900/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT AREA (Transparent, blocks inside are solid) */}
        <div className="pointer-events-auto">
          {tabs.map((tab) => (
            <div key={tab.id} className={currentActiveTab === tab.id ? 'block animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
              {/* Every tab gets its own unique canvas drop zone! */}
              <Element canvas id={tab.id} is={TabDropZone} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

TabsBlock.craft = {
  props: {
    tabs: [
      { id: 'tab_1', label: 'First Tab' },
      { id: 'tab_2', label: 'Second Tab' }
    ]
  },
  related: { settings: TabsBlockSettings },
  rules: { canDrag: () => true }
};


// 10. CREATE THE PLANNING CENTER BLOCK
const PlanningCenterBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const {
    isPrivateUnlocked, setIsPrivateUnlocked, passInput, setPassInput, internalSubTab, setInternalSubTab,
    siteContent, catering, logisticsCards, committees, updateField, isOverdue
  } = useContext(AppDataContext) || {};

  // --- REGISTRATION & FIREBASE STATE ---
  const [liveRegistrations, setLiveRegistrations] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFormFilter, setSelectedFormFilter] = React.useState('All');
  const [editingReg, setEditingReg] = React.useState(null);

  // Fetch live registrations from Firebase
  React.useEffect(() => {
    if (enabled) return;

    const unsubscribe = onSnapshot(collection(db, "registrations"), (snapshot) => {
      const regs = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
      regs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setLiveRegistrations(regs);
    });

    return () => unsubscribe();
  }, [enabled]);

  // Extract unique form names for the dropdown
  const uniqueForms = ['All', ...new Set(liveRegistrations.map(r => r.formTitle))];

  // Filter the table based on search and selected form
  const filteredRegistrations = liveRegistrations.filter(reg => {
    const matchesForm = selectedFormFilter === 'All' || reg.formTitle === selectedFormFilter;

    // Search broadly across all dynamic responses
    const matchesSearch = Object.values(reg.responses || {}).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchesForm && matchesSearch;
  });

  // Get dynamic columns based on the current filtered view
  const dynamicColumns = filteredRegistrations.length > 0 && filteredRegistrations[0].fieldLabels
    ? filteredRegistrations[0].fieldLabels
    : [];

  // Firebase actions
  const updateRegistrationStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Confirmed' ? 'Cancelled' : (currentStatus === 'Cancelled' ? 'Pending' : 'Confirmed');
    await updateDoc(doc(db, "registrations", id), { status: newStatus });
  };

  const deleteRegistration = async (id) => {
    if (window.confirm("Are you sure you want to delete this submission?")) {
      await deleteDoc(doc(db, "registrations", id));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReg) return;

    try {
      await updateDoc(doc(db, "registrations", editingReg.id), {
        responses: editingReg.responses
      });
      setEditingReg(null); // Close the modal on success
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update: " + error.message);
    }
  };

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) return;
    const headers = ["Date", "Form", "Status", ...dynamicColumns];
    const rows = filteredRegistrations.map(r => {
      const baseInfo = [
        `"${new Date(r.submittedAt).toLocaleDateString()}"`,
        `"${r.formTitle}"`,
        `"${r.status}"`
      ];
      const dynamicInfo = dynamicColumns.map(col => `"${r.responses[col] || ''}"`);
      return [...baseInfo, ...dynamicInfo];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedFormFilter === 'All' ? 'All' : selectedFormFilter}_Registrations.csv`;
    link.click();
  };

  const statusColors = {
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Cancelled: "bg-rose-100 text-rose-800 border-rose-200"
  };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-purple-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-purple-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Planning Center</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>

        <div className="max-w-5xl mx-auto py-10 px-4 animate-in fade-in duration-700">
          {!isPrivateUnlocked ? (
            /* PRIVATE LOGIN GATE */
            <div className="max-w-md mx-auto mt-6 md:mt-10 px-4 md:px-0">
              <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-900/5 text-center">

                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h2 className="font-serif italic text-xl md:text-2xl text-emerald-900 mb-1 md:mb-2">Planning Center</h2>
                <p className="text-slate-400 text-[8px] md:text-[10px] uppercase tracking-[0.2em] mb-6 md:mb-10">Secure Committee & Logistics Portal</p>

                <div className="space-y-3 md:space-y-4">
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-transparent focus:border-emerald-100 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-center text-xs md:text-base text-emerald-900 tracking-[0.3em] outline-none transition-all"
                    placeholder="••••••••"
                    value={passInput || ''}
                    onChange={(e) => setPassInput && setPassInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (passInput === 'GSM2026') { setIsPrivateUnlocked && setIsPrivateUnlocked(true); }
                        else { alert("Invalid Access Code"); setPassInput && setPassInput(''); }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (passInput === 'GSM2026') { setIsPrivateUnlocked && setIsPrivateUnlocked(true); }
                      else { alert("Invalid Access Code"); setPassInput && setPassInput(''); }
                    }}
                    className="w-full bg-emerald-900 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 transition-all active:scale-95"
                  >
                    Verify Access
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* UNLOCKED PLANNING CENTER DASHBOARD */
            <div className="animate-in slide-in-from-bottom-6 duration-500">
              {/* SUB-NAV */}
              <div className="flex bg-emerald-900/5 p-1 rounded-xl gap-1 shadow-inner mb-10 max-w-2xl mx-auto">
                <button
                  onClick={() => setInternalSubTab && setInternalSubTab('logistics')}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'logistics' || !internalSubTab ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900 hover:bg-emerald-900/10'}`}
                >
                  Logistics
                </button>
                <button
                  onClick={() => setInternalSubTab && setInternalSubTab('committees')}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'committees' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900 hover:bg-emerald-900/10'}`}
                >
                  Committees
                </button>
                <button
                  onClick={() => setInternalSubTab && setInternalSubTab('registration')}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'registration' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900 hover:bg-emerald-900/10'}`}
                >
                  Registration
                </button>
              </div>

              {/* LOGISTICS CONTENT */}
              {(internalSubTab === 'logistics' || !internalSubTab) && (
                <div className="animate-in fade-in pt-0 space-y-6 max-w-4xl mx-auto">
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-fit">
                    <div className="bg-emerald-900 p-4">
                      <h3 className="font-serif italic text-white text-lg tracking-tight leading-none text-center">
                        {siteContent?.cateringHeader || 'Food Contribution'}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {catering && catering.map((item, i) => (
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
                    {logisticsCards && logisticsCards.filter(card => !card.parentId).map(card => (
                      <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-100 border-l-[6px] border-emerald-900 shadow-sm hover:shadow-md transition-all duration-500">
                        <h4 className="font-black text-emerald-900 uppercase text-[9px] mb-2 tracking-widest italic opacity-40">{card.title}</h4>
                        <p className="text-[11px] md:text-sm text-slate-600 leading-relaxed font-bold tracking-tight whitespace-pre-line">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMITTEES CONTENT */}
              {internalSubTab === 'committees' && committees && (
                <div className="animate-in fade-in pt-0 space-y-6 max-w-4xl mx-auto">
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
                      <div key={comm.id} className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-slate-100 border-t-4 border-emerald-900 shadow-sm group hover:shadow-md transition-all duration-500">
                        <h3 className="font-bold text-emerald-900 text-[10px] md:text-xs uppercase tracking-tighter mb-3 md:mb-4">{comm.title}</h3>
                        <div className="space-y-2">
                          {comm.tasks?.map((t, i) => {
                            const overdue = !t.completed && isOverdue && isOverdue(t.dueDate);
                            return (
                              <div key={i} className={`p-2.5 md:p-3 rounded-lg border border-slate-50 transition-all duration-500 ${t.completed ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm'}`}>
                                <label className="flex items-start gap-2.5 md:gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 accent-emerald-600 w-3 h-3 md:w-3.5 md:h-3.5 rounded"
                                    checked={t.completed || false}
                                    onChange={(e) => {
                                      const updatedTasks = [...comm.tasks];
                                      updatedTasks[i].completed = e.target.checked;
                                      updateField('committees', comm.id, { tasks: updatedTasks });
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className={`text-xs md:text-sm font-bold ${t.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.text}</div>
                                    {t.dueDate && (
                                      <div className={`text-[9px] md:text-[10px] font-bold mt-1 ${t.completed ? 'text-slate-400' : overdue ? 'text-rose-500' : 'text-emerald-600'}`}>
                                        DUE: {new Date(t.dueDate).toLocaleDateString()} {overdue && '(OVERDUE)'}
                                      </div>
                                    )}
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

              {/* FIREBASE REGISTRATION CONTENT */}
              {internalSubTab === 'registration' && (
                <div className="animate-in fade-in pt-0 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-left">
                    <div className="bg-emerald-900 p-4 flex justify-between items-center">
                      <h3 className="font-serif italic text-white text-lg tracking-tight leading-none">
                        Guest Registrations
                      </h3>
                      <div className="flex items-center gap-4">
                        <button onClick={handleExportCSV} className="text-[9px] font-black uppercase bg-emerald-800 text-white px-3 py-1 rounded shadow-sm hover:bg-emerald-700 transition-colors">
                          Export CSV
                        </button>
                        <span className="text-emerald-100 text-[10px] uppercase font-bold tracking-widest">{filteredRegistrations.length} Total</span>
                      </div>
                    </div>

                    {/* SEARCH AND FILTER BAR */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search any field..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="sm:w-64">
                        <select
                          value={selectedFormFilter}
                          onChange={(e) => setSelectedFormFilter(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 outline-none cursor-pointer"
                        >
                          {uniqueForms.map(f => (
                            <option key={f} value={f}>{f === 'All' ? 'All Forms' : f}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-[9px] text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            {/* MOVED TO THE FRONT */}
                            <th className="px-6 py-4 font-black">Status / Actions</th>
                            <th className="px-6 py-4 font-black">Date</th>
                            <th className="px-6 py-4 font-black">Form Source</th>
                            {dynamicColumns.map((col, idx) => (
                              <th key={idx} className="px-6 py-4 font-black whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRegistrations.length === 0 ? (
                            <tr>
                              <td colSpan={dynamicColumns.length + 3} className="px-6 py-12 text-center text-slate-400">
                                <p className="italic mb-1">No registrations found.</p>
                                {searchQuery && <p className="text-xs">Try clearing your search or filter.</p>}
                              </td>
                            </tr>
                          ) : (
                            filteredRegistrations.map((reg) => (
                              <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group">

                                {/* MOVED TO THE FRONT & ADDED EDIT BUTTON */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <select
                                      value={reg.status}
                                      onChange={(e) => updateRegistrationStatus(reg.id, e.target.value)}
                                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border outline-none cursor-pointer ${statusColors[reg.status] || 'bg-slate-100'}`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Confirmed">Confirmed</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>

                                    {/* NEW EDIT BUTTON */}
                                    <button
                                      onClick={() => setEditingReg(reg)} /* <--- CHANGE THIS LINE */
                                      className="text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Edit Submission"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>

                                    {/* EXISTING DELETE BUTTON */}
                                    <button
                                      onClick={() => deleteRegistration(reg.id)}
                                      className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Delete Submission"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>

                                {/* ORIGINAL DATA COLUMNS */}
                                <td className="px-6 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                                  {new Date(reg.submittedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                    {reg.formTitle}
                                  </span>
                                </td>

                                {/* Dynamic Data Mapping */}
                                {dynamicColumns.map((col, idx) => (
                                  <td key={idx} className="px-6 py-4 text-xs font-medium text-slate-800">
                                    {reg.responses[col] || '—'}
                                  </td>
                                ))}

                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div >
      {/* EDIT REGISTRATION MODAL */}
      {
        editingReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">

              <div className="bg-emerald-900 p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-serif italic text-white text-lg leading-tight">Edit Registration</h3>
                  <p className="text-emerald-200 text-[10px] uppercase tracking-widest font-bold">{editingReg.formTitle}</p>
                </div>
                <button onClick={() => setEditingReg(null)} className="text-emerald-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                {editingReg.fieldLabels && editingReg.fieldLabels.map((label, idx) => (
                  <div key={idx} className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                    <input
                      type="text"
                      value={editingReg.responses[label] || ''}
                      onChange={(e) => {
                        setEditingReg({
                          ...editingReg,
                          responses: {
                            ...editingReg.responses,
                            [label]: e.target.value
                          }
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-medium focus:border-emerald-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingReg(null)}
                    className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

            </div>
          </div>
        )
      }
    </div >
  );
};
PlanningCenterBlock.craft = { rules: { canDrag: () => true } };


// 11. CREATE THE STANDALONE COUNTDOWN SETTINGS & BLOCK
const CountdownSettings = () => {
  const { targetDate, title, actions: { setProp } } = useNode((node) => ({
    targetDate: node.data.props.targetDate,
    title: node.data.props.title
  }));

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Block Title</label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => setProp((props) => props.title = e.target.value)}
          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 text-xs focus:border-orange-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Date & Time</label>
        <input
          type="datetime-local"
          value={targetDate || ''}
          onChange={(e) => setProp((props) => props.targetDate = e.target.value)}
          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 text-xs focus:border-orange-500 outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  );
};

const CountdownBlock = ({ targetDate, title }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  // Standalone logic: This block manages its own time!
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const diff = new Date(targetDate).getTime() - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-orange-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-orange-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-orange-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Countdown</span>}

      <div className={`flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${enabled ? 'pointer-events-none' : ''}`}>
        <h3 className="font-serif italic text-xl text-emerald-900 mb-4">{title}</h3>
        <div className="flex gap-4 md:gap-6 text-center justify-center">
          {Object.entries(timeLeft).map(([unit, val]) => (
            <div key={unit} className="flex flex-col min-w-[50px]">
              <span className="text-3xl md:text-4xl font-black text-emerald-900 tracking-tighter leading-none">{val}</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// We attach default props AND the Settings Panel to the block!
CountdownBlock.craft = {
  props: {
    title: "Event Countdown",
    targetDate: "2026-06-01T09:00"
  },
  related: {
    settings: CountdownSettings
  },
  rules: { canDrag: () => true }
};


// 12. CREATE THE ADVANCED MATRIX SETTINGS & BLOCK
const GenericMatrixSettings = () => {
  const { title, columns, rows, widths, actions: { setProp } } = useNode((node) => ({
    title: node.data.props.title,
    columns: node.data.props.columns,
    rows: node.data.props.rows,
    widths: node.data.props.widths || [] // Fallback for backwards compatibility
  }));

  // Ensure widths array matches columns length
  const safeWidths = columns.map((_, i) => widths[i] || "auto");

  const addColumn = () => setProp(p => {
    p.columns.push(`Col ${p.columns.length + 1}`);
    if (!p.widths) p.widths = safeWidths;
    p.widths.push("auto");
    p.rows.forEach(row => row.push(""));
  });

  const updateColumn = (index, val) => setProp(p => p.columns[index] = val);
  const updateWidth = (index, val) => setProp(p => {
    if (!p.widths) p.widths = safeWidths;
    p.widths[index] = val;
  });

  const removeColumn = (index) => setProp(p => {
    p.columns.splice(index, 1);
    if (p.widths) p.widths.splice(index, 1);
    p.rows.forEach(row => row.splice(index, 1));
  });

  const moveColumn = (index, dir) => setProp(p => {
    if ((dir === -1 && index === 0) || (dir === 1 && index === p.columns.length - 1)) return;
    const target = index + dir;
    // Swap Headers
    [p.columns[index], p.columns[target]] = [p.columns[target], p.columns[index]];
    // Swap Widths
    if (!p.widths) p.widths = safeWidths;
    [p.widths[index], p.widths[target]] = [p.widths[target], p.widths[index]];
    // Swap Data
    p.rows.forEach(row => {
      [row[index], row[target]] = [row[target], row[index]];
    });
  });

  const addRow = () => setProp(p => p.rows.push(new Array(p.columns.length).fill("")));
  const updateCell = (rowIndex, colIndex, val) => setProp(p => p.rows[rowIndex][colIndex] = val);
  const removeRow = (index) => setProp(p => p.rows.splice(index, 1));

  const moveRow = (index, dir) => setProp(p => {
    if ((dir === -1 && index === 0) || (dir === 1 && index === p.rows.length - 1)) return;
    const target = index + dir;
    [p.rows[index], p.rows[target]] = [p.rows[target], p.rows[index]];
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matrix Title</label>
        <input type="text" value={title || ''} onChange={(e) => setProp(p => p.title = e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 text-xs focus:border-blue-500 outline-none" placeholder="e.g., Event Program" />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Columns & Widths</label>
        {columns.map((col, i) => (
          <div key={i} className="flex gap-1 mb-2 items-center bg-slate-800 p-1.5 rounded border border-slate-700">
            <div className="flex flex-col gap-1">
              <button onClick={() => moveColumn(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-white disabled:opacity-30 text-[10px]">◀</button>
              <button onClick={() => moveColumn(i, 1)} disabled={i === columns.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30 text-[10px]">▶</button>
            </div>
            <div className="flex-1 space-y-1">
              <input type="text" value={col} onChange={(e) => updateColumn(i, e.target.value)} placeholder="Header Name" className="w-full bg-slate-900 text-white rounded p-1.5 text-xs outline-none focus:ring-1 ring-blue-500" />
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-slate-500 uppercase">Width:</span>
                <select value={safeWidths[i]} onChange={(e) => updateWidth(i, e.target.value)} className="bg-slate-900 text-slate-300 text-[10px] rounded p-1 outline-none flex-1">
                  <option value="auto">Auto</option>
                  <option value="10%">10%</option>
                  <option value="20%">20% (Small)</option>
                  <option value="30%">30%</option>
                  <option value="50%">50% (Half)</option>
                  <option value="70%">70% (Large)</option>
                </select>
              </div>
            </div>
            <button onClick={() => removeColumn(i)} className="text-red-400 hover:bg-red-500/20 px-2 py-3 rounded text-xs">✕</button>
          </div>
        ))}
        <button onClick={addColumn} className="w-full py-1.5 bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 text-[10px] font-black uppercase mt-1 hover:bg-blue-900/60">+ Add Column</button>
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Rows</label>
        {rows.map((row, rIndex) => (
          <div key={rIndex} className="p-3 bg-slate-800 border border-slate-700 rounded-lg mb-3 relative">
            <div className="absolute -top-3 -right-2 flex gap-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden z-10 shadow-lg">
              <button onClick={() => moveRow(rIndex, -1)} disabled={rIndex === 0} className="px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30 text-xs">▲</button>
              <button onClick={() => moveRow(rIndex, 1)} disabled={rIndex === rows.length - 1} className="px-2 py-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30 text-xs">▼</button>
              <button onClick={() => removeRow(rIndex)} className="px-2 py-1 text-red-400 hover:bg-red-500 hover:text-white text-xs">✕</button>
            </div>
            <div className="space-y-2 mt-2">
              {columns.map((col, cIndex) => (
                <div key={cIndex}>
                  <span className="text-[8px] uppercase text-blue-300 block mb-1 font-bold">{col}</span>
                  <textarea value={row[cIndex] || ""} onChange={(e) => updateCell(rIndex, cIndex, e.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-xs focus:border-blue-500 outline-none resize-none min-h-[40px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-2 bg-emerald-900/40 text-emerald-400 rounded-lg border border-emerald-900/50 text-[10px] font-black uppercase mt-1 hover:bg-emerald-900/60">+ Add Row</button>
      </div>
    </div>
  );
};

const GenericMatrixBlock = ({ title, columns, rows, widths }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const safeWidths = columns?.map((_, i) => (widths && widths[i]) ? widths[i] : "auto");

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-blue-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-blue-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Table Matrix</span>}
      <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-5xl mx-auto ${enabled ? 'pointer-events-none' : ''}`}>

        {/* Main Title */}
        {title && (
          <div className="bg-slate-900 p-4 border-b-4 border-blue-500">
            <h3 className="font-serif text-white text-xl tracking-tight text-center">{title}</h3>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200">
                {columns && columns.map((col, i) => (
                  <th key={i} style={{ width: safeWidths[i] }} className="p-4 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows && rows.length > 0 ? rows.map((row, rIndex) => (
                <tr key={rIndex} className="hover:bg-slate-50 transition-colors">
                  {columns && columns.map((_, cIndex) => (
                    <td key={cIndex} className="p-4 text-[13px] text-slate-800 align-top whitespace-pre-wrap">
                      {row[cIndex]}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr><td colSpan={columns?.length || 1} className="p-8 text-center text-slate-400 text-xs italic">No data rows added.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

GenericMatrixBlock.craft = {
  props: {
    title: "Event Program",
    columns: ["Time", "Activity", "Location"],
    widths: ["20%", "50%", "30%"],
    rows: [
      ["09:00 AM", "Registration & Welcome Coffee", "Main Lobby"],
      ["10:00 AM", "Keynote Speech", "Grand Auditorium"]
    ]
  },
  related: { settings: GenericMatrixSettings },
  rules: { canDrag: () => true }
};


// 13. CREATE THE COMMITTEE CHECKLIST SETTINGS & BLOCK
const CommitteeChecklistSettings = () => {
  const { committees, actions: { setProp } } = useNode((node) => ({ committees: node.data.props.committees }));
  const addCommittee = () => setProp(p => p.committees.push({ title: "New Committee", tasks: [] }));
  const removeCommittee = (cIndex) => setProp(p => p.committees.splice(cIndex, 1));
  const updateCommTitle = (cIndex, val) => setProp(p => p.committees[cIndex].title = val);
  const addTask = (cIndex) => setProp(p => p.committees[cIndex].tasks.push({ text: "New Task", assignee: "", dueDate: "", completed: false }));
  const removeTask = (cIndex, tIndex) => setProp(p => p.committees[cIndex].tasks.splice(tIndex, 1));
  const updateTask = (cIndex, tIndex, field, val) => setProp(p => p.committees[cIndex].tasks[tIndex][field] = val);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Committees & Tasks</label>
        {committees && committees.map((comm, cIndex) => (
          <div key={cIndex} className="p-3 bg-slate-800 border border-slate-700 rounded-lg space-y-3 relative">
            <button onClick={() => removeCommittee(cIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-600 transition-colors z-10">✕</button>
            <input type="text" value={comm.title} onChange={(e) => updateCommTitle(cIndex, e.target.value)} className="w-full bg-slate-900 text-white font-bold border border-slate-700 rounded p-2 text-xs focus:border-purple-500 outline-none" placeholder="Committee Name" />
            <div className="pl-2 border-l-2 border-slate-700 space-y-2">
              {comm.tasks && comm.tasks.map((task, tIndex) => (
                <div key={tIndex} className="bg-slate-900 p-2 rounded border border-slate-800 relative group">
                  <button onClick={() => removeTask(cIndex, tIndex)} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 text-[10px] font-bold">✕</button>
                  <input type="text" value={task.text} onChange={(e) => updateTask(cIndex, tIndex, 'text', e.target.value)} className="w-[90%] bg-transparent text-slate-300 text-[10px] outline-none mb-1 focus:text-white" placeholder="Task description..." />
                  <div className="flex gap-1">
                    <input type="text" value={task.assignee} onChange={(e) => updateTask(cIndex, tIndex, 'assignee', e.target.value)} className="flex-1 bg-slate-800 text-slate-400 border border-slate-700 rounded px-1 py-0.5 text-[9px] outline-none focus:border-purple-500" placeholder="@assignee" />
                    <input type="date" value={task.dueDate} onChange={(e) => updateTask(cIndex, tIndex, 'dueDate', e.target.value)} className="flex-1 bg-slate-800 text-slate-400 border border-slate-700 rounded px-1 py-0.5 text-[9px] outline-none [color-scheme:dark] focus:border-purple-500" />
                  </div>
                </div>
              ))}
              <button onClick={() => addTask(cIndex)} className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[9px] font-bold uppercase tracking-wider transition-colors">+ Add Task</button>
            </div>
          </div>
        ))}
        <button onClick={addCommittee} className="w-full py-2 bg-purple-900/40 text-purple-400 hover:bg-purple-900/60 border border-purple-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all mt-2">+ Add Committee</button>
      </div>
    </div>
  );
};

const CommitteeChecklistBlock = ({ committees }) => {
  const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const totalTasks = committees.reduce((acc, comm) => acc + (comm.tasks?.length || 0), 0) || 1;
  const completedTasks = committees.reduce((acc, comm) => acc + (comm.tasks?.filter(t => t.completed).length || 0), 0);
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const toggleTask = (cIndex, tIndex) => {
    if (!enabled && setProp) setProp(p => p.committees[cIndex].tasks[tIndex].completed = !p.committees[cIndex].tasks[tIndex].completed);
  };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all max-w-5xl mx-auto ${enabled ? 'border-2 border-dashed border-purple-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-purple-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Committees</span>}
      <div className={`space-y-6 ${enabled ? 'pointer-events-none' : ''}`}>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-end mb-1">
            <h3 className="font-black text-emerald-900 text-[9px] uppercase tracking-widest italic opacity-40">Event Readiness</h3>
            <span className="font-serif italic text-emerald-900 text-3xl tracking-tighter">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border shadow-inner">
            <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
          {committees.map((comm, cIndex) => (
            <div key={cIndex} className="bg-white p-5 rounded-xl border border-slate-100 border-t-4 border-emerald-900 shadow-sm group hover:shadow-md transition-all duration-500">
              <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-tighter mb-4">{comm.title}</h3>
              <div className="space-y-2">
                {comm.tasks?.map((t, tIndex) => (
                  <div key={tIndex} className={`p-3 rounded-lg border border-slate-50 transition-all duration-500 ${t.completed ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm'}`}>
                    <label className="flex items-start gap-3 cursor-pointer" onClick={(e) => { e.preventDefault(); toggleTask(cIndex, tIndex); }}>
                      <input type="checkbox" className="mt-0.5 accent-emerald-600 w-3.5 h-3.5 rounded" checked={t.completed || false} readOnly />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] md:text-[11px] block font-bold tracking-tight ${t.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.text}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

CommitteeChecklistBlock.craft = {
  props: { committees: [{ title: "Logistics", tasks: [{ text: "Confirm Venue", assignee: "Sarah", dueDate: "", completed: true }] }] },
  related: { settings: CommitteeChecklistSettings },
  rules: { canDrag: () => true }
};


// 14. CREATE THE FORM BUILDER SETTINGS & BLOCK
const FormBuilderSettings = () => {
  const { setProp, title, description, submitText, fields, headerColor, headerTextColor, buttonColor, buttonTextColor } = useNode((node) => ({
    title: node.data.props.title,
    description: node.data.props.description,
    submitText: node.data.props.submitText,
    fields: node.data.props.fields,
    // Add these new properties:
    headerColor: node.data.props.headerColor,
    headerTextColor: node.data.props.headerTextColor,
    buttonColor: node.data.props.buttonColor,
    buttonTextColor: node.data.props.buttonTextColor
  }));

  const updateField = (index, key, value) => {
    setProp((props) => {
      props.fields[index][key] = value;
    });
  };

  const addField = () => {
    setProp((props) => {
      props.fields.push({ type: 'text', label: 'New Question', placeholder: '', required: false, options: '', allowOther: false });
    });
  };

  const removeField = (index) => {
    setProp((props) => {
      props.fields.splice(index, 1);
    });
  };

  return (
    <div className="space-y-4 p-4 text-left">
      {/* --- NEW STYLE SETTINGS SECTION --- */}
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg space-y-2 mb-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Aesthetics</h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Form Header Background Color */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">Header BG Color</label>
            <div className="flex gap-2">
              <input type="color" value={headerColor || '#064e3b'} onChange={(e) => setProp(props => props.headerColor = e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              <span className="text-[10px] text-slate-300 font-mono">{headerColor || '#064e3b'}</span>
            </div>
          </div>
          {/* Form Header Text Color */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">Header Text Color</label>
            <div className="flex gap-2">
              <input type="color" value={headerTextColor || '#ffffff'} onChange={(e) => setProp(props => props.headerTextColor = e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              <span className="text-[10px] text-slate-300 font-mono">{headerTextColor || '#ffffff'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Button Background Color */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">Button BG Color</label>
            <div className="flex gap-2">
              <input type="color" value={buttonColor || '#10b981'} onChange={(e) => setProp(props => props.buttonColor = e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              <span className="text-[10px] text-slate-300 font-mono">{buttonColor || '#10b981'}</span>
            </div>
          </div>
          {/* Button Text Color */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">Button Text Color</label>
            <div className="flex gap-2">
              <input type="color" value={buttonTextColor || '#ffffff'} onChange={(e) => setProp(props => props.buttonTextColor = e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" />
              <span className="text-[10px] text-slate-300 font-mono">{buttonTextColor || '#ffffff'}</span>
            </div>
          </div>
        </div>
      </div>
      {/* --- END NEW STYLE SETTINGS --- */}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">Form Title</label>
        <input
          type="text"
          value={title || ''}
          onChange={(e) => setProp(props => props.title = e.target.value)}
          className="w-full p-2 bg-slate-800 rounded text-xs text-white border border-slate-700"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">Description</label>
        <input
          type="text"
          value={description || ''}
          onChange={(e) => setProp(props => props.description = e.target.value)}
          className="w-full p-2 bg-slate-800 rounded text-xs text-white border border-slate-700"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">Submit Button Text</label>
        <input
          type="text"
          value={submitText || ''}
          onChange={(e) => setProp(props => props.submitText = e.target.value)}
          className="w-full p-2 bg-slate-800 rounded text-xs text-white border border-slate-700"
        />
      </div>

      <hr className="border-slate-700 my-4" />
      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Form Fields</h3>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
        {fields?.map((field, index) => (
          <div key={index} className="p-3 bg-slate-800 border border-slate-700 rounded-lg space-y-2 relative group">
            <button
              onClick={() => removeField(index)}
              className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
            >
              ✕
            </button>

            <input
              type="text"
              placeholder="Question Label"
              value={field.label}
              onChange={(e) => updateField(index, 'label', e.target.value)}
              className="w-full bg-transparent text-sm text-white font-bold outline-none border-b border-slate-600 pb-1"
            />

            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(e) => updateField(index, 'type', e.target.value)}
                className="flex-1 bg-slate-900 text-xs text-slate-300 p-1.5 rounded border border-slate-700 outline-none cursor-pointer"
              >
                <option value="text">Short Text</option>
                <option value="paragraph">Long Text</option>
                <option value="dropdown">Dropdown</option>
                <option value="radio">Multiple Choice</option>
                <option value="checkbox">Checkboxes</option>
              </select>

              <label className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, 'required', e.target.checked)}
                  className="cursor-pointer"
                />
                Req
              </label>

              {(field.type === 'radio' || field.type === 'checkbox') && (
                <label className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={field.allowOther || false}
                    onChange={(e) => updateField(index, 'allowOther', e.target.checked)}
                    className="cursor-pointer"
                  />
                  + Other
                </label>
              )}
            </div>

            {(field.type === 'radio' || field.type === 'dropdown' || field.type === 'checkbox') && (
              <input
                type="text"
                placeholder="Options (comma separated)"
                value={field.options || ''}
                onChange={(e) => updateField(index, 'options', e.target.value)}
                className="w-full bg-slate-900 p-1.5 rounded text-[10px] text-emerald-400 outline-none border border-slate-700"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        className="w-full py-2 border border-dashed border-slate-600 rounded text-xs font-bold text-slate-400 hover:text-white hover:border-slate-400 transition-colors mt-2"
      >
        + Add Question
      </button>
    </div>
  );
};
const FormBuilderBlock = ({ title, description, submitText, fields, headerColor, headerTextColor, buttonColor, buttonTextColor }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enabled) return;

    const formData = new FormData(e.target);
    const rawData = Object.fromEntries(formData.entries());

    const responses = {};
    const fieldLabels = [];

    fields.forEach((field, i) => {
      fieldLabels.push(field.label);

      let value = rawData[field.label] || rawData[`field_${i}`] || "N/A";

      if (field.type === 'checkbox') {
        const checks = formData.getAll(field.label).length ? formData.getAll(field.label) : formData.getAll(`field_${i}`);
        value = checks.join(', ') || "N/A";
      } else if (field.type === 'radio' && value === 'Other') {
        value = `Other: ${rawData[`${field.label}_other`] || rawData[`field_${i}_other`] || ''}`;
      }

      responses[field.label] = value;
    });

    const newRegistration = {
      formTitle: title || "Untitled Form",
      submittedAt: new Date().toISOString(),
      status: "Pending",
      fieldLabels: fieldLabels,
      responses: responses
    };

    try {
      await addDoc(collection(db, "registrations"), newRegistration);
      alert("Registration Submitted!");
      e.target.reset();
    } catch (error) {
      console.error("Firebase Error:", error);
      alert(`Submission failed: ${error.message}`);
    }
  };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full max-w-2xl mx-auto transition-all ${enabled ? 'border-2 border-dashed border-rose-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-rose-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-rose-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Form Builder</span>}

      {/* --- UPDATED STYLE TO MATCH AESTHETIC --- */}
      <div className={`bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden ${enabled ? 'pointer-events-none' : ''}`}>

        {/* Header uses custom styles: */}
        <div className="p-4 text-center" style={{ backgroundColor: headerColor || '#064e3b' }}>
          <h2 className="font-serif text-2xl tracking-tight mb-1" style={{ color: headerTextColor || '#ffffff' }}>{title}</h2>
          {description && <p className="text-sm opacity-80" style={{ color: headerTextColor || '#ffffff' }}>{description}</p>}
        </div>

        <div className="p-6 space-y-5">
          {fields && fields.length > 0 ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {fields.map((field, i) => {
                return (
                  <div key={i} className="flex flex-col gap-2">
                    <label className="font-bold text-slate-700 text-sm flex gap-1">
                      {field.label} {field.required && <span className="text-emerald-500">*</span>}
                    </label>

                    {field.type === 'textarea' || field.type === 'paragraph' ? (
                      <textarea name={field.label} required={field.required} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none resize-none min-h-[100px]" />
                    ) : field.type === 'select' || field.type === 'dropdown' ? (
                      <select name={field.label} required={field.required} defaultValue="" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none">
                        <option value="" disabled>Select an option...</option>
                        {field.options && field.options.split(',').map((opt, optIndex) => (
                          <option key={optIndex} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-2 mt-1">
                        {field.options && field.options.split(',').map((opt, optIndex) => (
                          <label key={optIndex} className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name={field.label} value={opt.trim()} required={field.required && !field.allowOther} className="accent-emerald-500 w-4 h-4" />
                            <span className="text-sm text-slate-700">{opt.trim()}</span>
                          </label>
                        ))}
                        {field.allowOther && (
                          <label className="flex items-center gap-3 cursor-pointer mt-2">
                            <input type="radio" name={field.label} value="Other" className="accent-emerald-500 w-4 h-4" />
                            <span className="text-sm text-slate-700">Other:</span>
                            <input type="text" name={`${field.label}_other`} className="flex-1 border-b border-slate-300 focus:border-emerald-500 outline-none text-sm px-2 py-1 bg-transparent" />
                          </label>
                        )}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="space-y-2 mt-1">
                        {field.options && field.options.split(',').map((opt, optIndex) => (
                          <label key={optIndex} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name={field.label} value={opt.trim()} className="accent-emerald-500 w-4 h-4 rounded" />
                            <span className="text-sm text-slate-700">{opt.trim()}</span>
                          </label>
                        ))}
                        {field.allowOther && (
                          <label className="flex items-center gap-3 cursor-pointer mt-2">
                            <input type="checkbox" name={field.label} value="Other" className="accent-rose-500 w-4 h-4 rounded" />
                            <span className="text-sm text-slate-700">Other:</span>
                            <input type="text" name={`${field.label}_other`} className="flex-1 border-b border-slate-300 focus:border-rose-500 outline-none text-sm px-2 py-1 bg-transparent" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <input type={field.type} name={field.label} required={field.required} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none" />
                    )}
                  </div>
                );
              })}

              {/* Submit Button uses custom styles: */}
              <button
                type={enabled ? "button" : "submit"}
                className="w-full font-bold py-3 rounded-xl mt-4 shadow-md text-l active:scale-90 transition-all"
                style={{ backgroundColor: buttonColor || '#10b981', color: buttonTextColor || '#ffffff' }}
              >
                {submitText}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 text-slate-400 italic text-sm">No fields added.</div>
          )}
        </div>
      </div>
    </div>
  );
};

FormBuilderBlock.craft = {
  props: {
    title: "Event Registration",
    description: "Please fill out your details.",
    submitText: "Register Now",
    fields: [
      { type: 'text', label: 'Full Name', placeholder: '', required: true, options: '', allowOther: false },
      { type: 'text', label: 'Mobile', placeholder: '', required: true, options: '', allowOther: false },
      { type: 'radio', label: 'Size', placeholder: '', required: true, options: 'S, M, L', allowOther: true }
    ],
    // Set professional emerald defaults instead of vibrant pink:
    headerColor: '#064e3b', // Dark emerald
    headerTextColor: '#ffffff', // White
    buttonColor: '#064e3b', // Dark emerald
    buttonTextColor: '#ffffff' // White
  },
  related: {
    settings: FormBuilderSettings
  },
  rules: { canDrag: () => true }
};

// ==========================================
// 0. PAGE ROOT (The truly invisible canvas)
// ==========================================
const PageRoot = ({ children }) => {
  const { connectors: { connect } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  return (
    <div
      ref={(ref) => enabled ? connect(ref) : null}
      className={`w-full flex flex-col ${enabled ? 'min-h-[60vh] pb-60' : 'min-h-0'}`}
    >
      {children}
    </div>
  );
};
PageRoot.craft = { rules: { canDrag: () => false } };

// ==========================================
// 1. ADVANCED TEXT BLOCK
// ==========================================
const TextSettings = () => {
  const { setProp, text, colorHex, fluidSize, align, fontFam } = useNode((node) => node.data.props);
  const quillModules = { toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'script': 'sub' }, { 'script': 'super' }], ['link'], ['clean']] };
  return (
    <div className="flex flex-col gap-3 text-xs">
      <label className="font-bold text-slate-400">Content</label>
      <div className="bg-white text-slate-900 rounded-md overflow-hidden mb-2">
        <ReactQuill theme="snow" value={text} onChange={(val) => setProp((p) => p.text = val)} modules={quillModules} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-bold text-slate-400">Color</label>
          <input type="color" value={colorHex} onChange={(e) => setProp((p) => p.colorHex = e.target.value)} className="w-full h-8 cursor-pointer" />
        </div>
        <div>
          <label className="font-bold text-slate-400">Fluid Size</label>
          <select value={fluidSize} onChange={(e) => setProp((p) => p.fluidSize = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white w-full">
            <option value="calc(0.75rem + 0.5vw)">Small</option>
            <option value="calc(0.9rem + 0.75vw)">Normal</option>
            <option value="calc(1.1rem + 1vw)">Large</option>
            <option value="calc(1.5rem + 1.5vw)">Extra Large</option>
            <option value="calc(2rem + 2.5vw)">Huge</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const AdvancedText = ({ text, colorHex, fluidSize, align, fontFam }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`p-1 transition-all w-full ${selected && enabled ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}>
      <div className={`${fontFam} break-words whitespace-pre-wrap ql-editor [&_p]:!text-[inherit] [&_p]:!m-0`} style={{ fontSize: fluidSize, color: colorHex, textAlign: align, lineHeight: '1.4', padding: 0 }} dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
};
AdvancedText.craft = { props: { text: "Enter your text here", colorHex: "#064e3b", fluidSize: "calc(1.5rem + 1.5vw)", align: "left", fontFam: "font-serif" }, related: { settings: TextSettings } };

// ==========================================
// 2. CTA BUTTON BLOCK
// ==========================================
const ButtonSettings = () => {
  const { setProp, text, link, variant, colorHex, rounding, sizeClass } = useNode((node) => node.data.props);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <input type="text" placeholder="Button Text" value={text} onChange={(e) => setProp(p => p.text = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white" />
      <input type="text" placeholder="https://link.com" value={link} onChange={(e) => setProp(p => p.link = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white" />

      <div className="grid grid-cols-2 gap-2">
        <select value={variant} onChange={(e) => setProp(p => p.variant = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white"><option value="solid">Solid Box</option><option value="outline">Outline</option><option value="underline">Underline</option></select>
        <select value={rounding} onChange={(e) => setProp(p => p.rounding = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white"><option value="rounded-none">Square</option><option value="rounded-md">Rounded</option><option value="rounded-full">Pill</option></select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-bold text-slate-400">Color</label>
          <input type="color" value={colorHex} onChange={(e) => setProp((p) => p.colorHex = e.target.value)} className="w-full h-8" />
        </div>
        <div>
          <label className="font-bold text-slate-400">True Fluid Size</label>
          <select value={sizeClass} onChange={(e) => setProp((p) => p.sizeClass = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white w-full">
            <option value="text-[calc(0.7rem+0.3vw)] px-[calc(1rem+1vw)] py-[calc(0.5rem+0.5vw)]">Small</option>
            <option value="text-[calc(0.8rem+0.5vw)] px-[calc(1.25rem+1.5vw)] py-[calc(0.75rem+0.75vw)]">Normal</option>
            <option value="text-[calc(1rem+1vw)] px-[calc(1.5rem+2vw)] py-[calc(1rem+1vw)]">Large</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const CTAButton = ({ text, link, variant, colorHex, rounding, sizeClass }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  let styles = {};
  if (variant === 'solid') styles = { backgroundColor: colorHex, color: '#fff' };
  if (variant === 'outline') styles = { border: `2px solid ${colorHex}`, color: colorHex };
  if (variant === 'underline') styles = { borderBottom: `2px solid ${colorHex}`, color: colorHex, paddingBottom: '2px', paddingLeft: 0, paddingRight: 0 };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`inline-block p-1 w-full sm:w-auto text-center ${selected && enabled ? 'ring-2 ring-blue-500' : ''}`}>
      <a href={enabled ? '#' : link} onClick={(e) => enabled && e.preventDefault()} style={styles} className={`block font-bold tracking-widest uppercase transition-all hover:opacity-80 break-words whitespace-normal ${variant !== 'underline' ? rounding : ''} ${variant === 'underline' ? 'text-[calc(0.8rem+0.5vw)] py-2' : sizeClass}`}>
        {text}
      </a>
    </div>
  );
};

CTAButton.craft = {
  props: { text: "Click Here", link: "#", variant: "solid", colorHex: "#064e3b", rounding: "rounded-full", sizeClass: "text-[calc(0.8rem+0.5vw)] px-[calc(1.25rem+1.5vw)] py-[calc(0.75rem+0.75vw)]" },
  related: { settings: ButtonSettings }
};

// ==========================================
// 3. GRID BLOCK 
// ==========================================
const GridSettings = () => {
  const { setProp, columns, gap, bgColor, rounding } = useNode((node) => node.data.props);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <label className="font-bold text-slate-400">Desktop Columns ({columns})</label><input type="range" min="1" max="4" value={columns} onChange={(e) => setProp(p => p.columns = parseInt(e.target.value))} className="w-full" />
      <label className="font-bold text-slate-400">Gap/Spacing</label><input type="range" min="0" max="4" step="0.5" value={gap} onChange={(e) => setProp(p => p.gap = parseFloat(e.target.value))} className="w-full" />
      <div className="grid grid-cols-2 gap-2">
        <input type="color" value={bgColor} onChange={(e) => setProp(p => p.bgColor = e.target.value)} className="w-full h-8" />
        <select value={rounding} onChange={(e) => setProp(p => p.rounding = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white"><option value="rounded-none">Square</option><option value="rounded-2xl">Rounded</option><option value="rounded-[3rem]">Super Round</option></select>
      </div>
    </div>
  );
};
const GridBlock = ({ columns, gap, bgColor, rounding, children }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const getGridClass = (cols) => {
    switch (cols) {
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      default: return "grid-cols-1";
    }
  };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full overflow-hidden transition-all h-auto ${rounding} ${enabled ? 'border-2 border-dashed border-sky-300 min-h-[50px]' : ''} ${selected && enabled ? 'ring-4 ring-blue-500 z-10' : ''}`} style={{ backgroundColor: bgColor }}>
      {enabled && <span className="absolute top-1 left-2 text-[8px] font-black text-sky-400 uppercase tracking-widest pointer-events-none z-20">Grid</span>}
      <div className={`grid ${getGridClass(columns)} w-full`} style={{ gap: `${gap}rem`, padding: `${gap}rem` }}>
        {children}
      </div>
    </div>
  );
};
GridBlock.craft = { props: { columns: 2, gap: 1, bgColor: "transparent", rounding: "rounded-none" }, related: { settings: GridSettings } };

// ==========================================
// 4. MASTER SECTION CONTAINER
// ==========================================
const SectionSettings = () => {
  const { setProp, bgColor, py, px } = useNode((node) => node.data.props);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <label className="font-bold text-slate-400">Background Color</label><input type="color" value={bgColor} onChange={(e) => setProp(p => p.bgColor = e.target.value)} className="w-full h-8" />
      <label className="font-bold text-slate-400">Top/Bottom Padding</label><input type="range" min="0" max="10" step="1" value={py} onChange={(e) => setProp(p => p.py = parseInt(e.target.value))} className="w-full" />
      <label className="font-bold text-slate-400">Left/Right Padding</label><input type="range" min="0" max="10" step="1" value={px} onChange={(e) => setProp(p => p.px = parseInt(e.target.value))} className="w-full" />
    </div>
  );
};
const SectionContainer = ({ bgColor, py, px, children }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full h-auto transition-all ${enabled ? 'border-2 border-dashed border-emerald-300 min-h-[50px]' : ''} ${selected && enabled ? 'ring-4 ring-emerald-500 z-10' : ''}`} style={{ backgroundColor: bgColor, padding: `${py}rem ${px}rem` }}>
      {enabled && <span className="absolute top-0 left-0 bg-emerald-300 text-emerald-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest pointer-events-none z-20">Section</span>}
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">{children}</div>
    </div>
  );
};
SectionContainer.craft = { props: { bgColor: "transparent", py: 4, px: 1 }, related: { settings: SectionSettings } };

// ==========================================
// 5. BANNER BLOCK
// ==========================================
const BannerSettings = () => {
  const { setProp, bgType, bgImage, bgColor, overlayOpacity, aspect, rounding } = useNode((node) => node.data.props);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <label className="font-bold text-slate-400">Background Style</label>
      <select value={bgType} onChange={(e) => setProp(p => p.bgType = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white">
        <option value="image">Image URL</option>
        <option value="color">Solid Color</option>
      </select>

      {bgType === 'image' ? (
        <input type="text" value={bgImage} onChange={(e) => setProp(p => p.bgImage = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white" />
      ) : (
        <input type="color" value={bgColor} onChange={(e) => setProp(p => p.bgColor = e.target.value)} className="w-full h-8" />
      )}

      <label className="font-bold text-slate-400 mt-2">Dimensions & Shape</label>
      <div className="grid grid-cols-2 gap-2">
        <select value={aspect} onChange={(e) => setProp(p => p.aspect = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white">
          <option value="auto">Auto (Fits Content)</option>
          <option value="21 / 9">Ultrawide (21:9)</option>
          <option value="16 / 9">Landscape (16:9)</option>
          <option value="4 / 3">Standard (4:3)</option>
          <option value="1 / 1">Square (1:1)</option>
          <option value="3 / 4">Portrait (3:4)</option>
          <option value="9 / 16">Vertical Mobile (9:16)</option>
        </select>
        <select value={rounding} onChange={(e) => setProp(p => p.rounding = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white">
          <option value="rounded-none">Rectangle</option>
          <option value="rounded-2xl">Round</option>
          <option value="rounded-[3rem]">Super Round</option>
        </select>
      </div>

      <label className="font-bold text-slate-400 mt-2">Overlay Darken ({Math.round(overlayOpacity * 100)}%)</label>
      <input type="range" min="0" max="1" step="0.1" value={overlayOpacity} onChange={(e) => setProp(p => p.overlayOpacity = parseFloat(e.target.value))} className="w-full" />
    </div>
  );
};

const BannerBlock = ({ bgType, bgImage, bgColor, overlayOpacity, aspect, rounding, children }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const backgroundStyle = bgType === 'image'
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: bgColor };

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null}
      className={`relative w-full flex items-center justify-center overflow-hidden transition-all ${rounding} ${enabled ? 'shadow-xl border-2 border-dashed border-purple-300' : ''} ${selected && enabled ? 'ring-4 ring-purple-500 z-10' : ''}`}
      style={{ 
        aspectRatio: aspect, 
        minHeight: aspect === 'auto' ? '250px' : '200px', 
        ...backgroundStyle 
      }}
    >
      {enabled && <span className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Banner</span>}
      <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }}></div>
      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center text-center gap-2 md:gap-4">{children}</div>
    </div>
  );
};

BannerBlock.craft = { 
  props: { bgType: "image", bgImage: "https://images.unsplash.com/photo-1438259183166-4df4f3f0194b?q=80&w=2000", bgColor: "#1e293b", overlayOpacity: 0.4, aspect: "16 / 9", rounding: "rounded-none" }, 
  related: { settings: BannerSettings } 
};

// ==========================================
// 6. SLIDESHOW BLOCK
// ==========================================
const SlideshowSettings = () => {
  const { setProp, images, interval, aspect, rounding } = useNode((node) => node.data.props);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <label className="font-bold text-slate-400">Dimensions & Shape</label>
      <div className="grid grid-cols-2 gap-2">
        <select value={aspect} onChange={(e) => setProp(p => p.aspect = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white">
          <option value="21 / 9">Ultrawide (21:9)</option>
          <option value="16 / 9">Landscape (16:9)</option>
          <option value="4 / 3">Standard (4:3)</option>
          <option value="1 / 1">Square (1:1)</option>
          <option value="3 / 4">Portrait (3:4)</option>
          <option value="9 / 16">Vertical Mobile (9:16)</option>
        </select>
        <select value={rounding} onChange={(e) => setProp(p => p.rounding = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white">
          <option value="rounded-none">Rectangle</option>
          <option value="rounded-2xl">Round</option>
          <option value="rounded-[3rem]">Super Round</option>
        </select>
      </div>

      <label className="font-bold text-slate-400 mt-2">Speed ({interval}s)</label>
      <input type="range" min="1" max="10" step="1" value={interval} onChange={(e) => setProp(p => p.interval = parseInt(e.target.value))} className="w-full" />

      <label className="font-bold text-slate-400 mt-2">Images</label>
      {images.map((img, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={img} onChange={(e) => setProp(p => p.images[i] = e.target.value)} className="border border-slate-700 bg-slate-800 p-2 rounded text-white flex-1" />
          <button onClick={() => setProp(p => p.images.splice(i, 1))} className="bg-red-500 text-white px-2 rounded">X</button>
        </div>
      ))}
      <button onClick={() => setProp(p => p.images.push(""))} className="bg-slate-700 text-white p-2 rounded">+ Add Image</button>
    </div>
  );
};
const SlideshowBlock = ({ images, interval, aspect, rounding }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1 || enabled) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), interval * 1000);
    return () => clearInterval(timer);
  }, [images, interval, enabled]);

  const validImages = images.filter(img => img.trim() !== "");

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full overflow-hidden bg-slate-200 transition-all ${rounding} ${selected && enabled ? 'ring-4 ring-orange-500 z-10' : ''}`} style={{ aspectRatio: aspect }}>
      {enabled && <span className="absolute top-0 left-0 bg-orange-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Slideshow</span>}
      {validImages.length > 0 ? (
        <>
          <img src={validImages[currentIndex]} alt="Slide" className="w-full h-full object-cover transition-opacity duration-700" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {validImages.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50 shadow-lg'}`} />))}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">No Images Added</div>
      )}
    </div>
  );
};
SlideshowBlock.craft = { props: { images: ["https://images.unsplash.com/photo-1510511459019-5efa32c94c7a?q=80&w=2000", "https://images.unsplash.com/photo-1438259183166-4df4f3f0194b?q=80&w=2000"], interval: 4, aspect: "16 / 9", rounding: "rounded-none" }, related: { settings: SlideshowSettings } };

// ==========================================
// 7. SIDEBAR & RENDERER
// ==========================================
const EditorSidebar = ({ activeTab }) => {
  const { connectors, query, actions, selected, selectedNodeId } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selectedSettings;
    if (currentNodeId) selectedSettings = state.nodes[currentNodeId].related?.settings;
    return {
      selected: selectedSettings,
      selectedNodeId: currentNodeId
    };
  });

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "sandbox", activeTab), { content: query.serialize() });
      alert(`Changes published to ${activeTab}!`);
    } catch (error) {
      alert("Error saving.");
    }
  };

  const handleWipe = async () => {
    if (window.confirm("WARNING: This will completely delete everything on this page. Are you sure?")) {
      try {
        await setDoc(doc(db, "sandbox", activeTab), { content: null });
        window.location.reload();
      } catch (error) {
        alert("Error wiping page.");
      }
    }
  };

  return (
    <div className="w-80 h-screen bg-slate-900 text-white fixed top-0 right-0 shadow-2xl flex flex-col z-[100] overflow-y-auto">
      <div className="p-6 border-b border-slate-700 bg-slate-800 flex justify-between items-center mt-14">
        <span className="font-bold tracking-wider text-sm uppercase">Editor</span>
        <div className="flex gap-2">
          <button onClick={handleWipe} className="bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold px-3 py-2 rounded-full transition">Wipe</button>
          <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-bold px-4 py-2 rounded-full transition">Save</button>
        </div>
      </div>

      <div className="p-6 border-b border-slate-700">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Layout Blocks</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button ref={(ref) => connectors.create(ref, <Element is={SectionContainer} canvas />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-emerald-400 font-bold">+ Section</button>
          <button ref={(ref) => connectors.create(ref, <Element is={BannerBlock} canvas />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-purple-400 font-bold">+ Banner</button>
          <button ref={(ref) => connectors.create(ref, <Element is={GridBlock} canvas />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-sky-400 font-bold">+ Grid</button>
          <button ref={(ref) => connectors.create(ref, <SlideshowBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-orange-400 font-bold">+ Slideshow</button>
          <button ref={(ref) => connectors.create(ref, <TabsBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-yellow-400 font-bold col-span-2">+ Tabs Container</button>
        </div>

        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Content Elements</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button ref={(ref) => connectors.create(ref, <AdvancedText />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700">+ Text</button>
          <button ref={(ref) => connectors.create(ref, <CTAButton />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700">+ Button</button>
        </div>

        {/* --- NEW ATOMIC BLOCKS SECTION --- */}
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Atomic Blocks</h3>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button ref={(ref) => connectors.create(ref, <CountdownBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-orange-400 font-bold">+ Countdown</button>

          {/* Replaced Catering with Generic Matrix here: */}
          <button ref={(ref) => connectors.create(ref, <GenericMatrixBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-blue-400 font-bold">+ Matrix</button>

          <button ref={(ref) => connectors.create(ref, <CommitteeChecklistBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-purple-400 font-bold">+ Committees</button>

          <button ref={(ref) => connectors.create(ref, <FormBuilderBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-rose-400 font-bold">+ Form</button>

        </div>

        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">App Components</h3>
        <div className="grid grid-cols-2 gap-2">
          <button ref={(ref) => connectors.create(ref, <SiteHeaderBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-pink-400 font-bold">+ Header</button>
          <button ref={(ref) => connectors.create(ref, <HomeWidgetsBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-amber-400 font-bold">+ Home</button>
          <button ref={(ref) => connectors.create(ref, <ProgramBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-cyan-400 font-bold">+ Program</button>
          <button ref={(ref) => connectors.create(ref, <RegistrationBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-rose-400 font-bold">+ Register</button>
          <button ref={(ref) => connectors.create(ref, <MapBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-blue-400 font-bold">+ Map</button>
          <button ref={(ref) => connectors.create(ref, <VisionBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-indigo-400 font-bold">+ Vision</button>
          <button ref={(ref) => connectors.create(ref, <PlanningCenterBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-purple-400 font-bold col-span-2">+ Planning Center</button>
        </div>
      </div>

      <div className="p-6 flex-1 bg-slate-900">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Block Settings</h3>
        {selected ? (
          <div className="flex flex-col gap-4">
            {React.createElement(selected)}
            <hr className="border-slate-700 my-2" />
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this block?")) {
                  actions.delete(selectedNodeId);
                }
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 py-2 rounded text-xs font-bold transition-colors"
            >
              🗑️ Delete This Block
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Click an element to edit.</p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 8. FINAL MAIN COMPONENT (With Real-Time Sync)
// ==========================================
export default function LivePage({ isAdmin, activeTab = 'home', appData }) {
  const [registrations, setRegistrations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset loading state when switching tabs
    setLoading(true);

    // Set up real-time listener instead of one-time fetch
    const unsubscribe = onSnapshot(
      doc(db, "sandbox", activeTab),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().content) {
          setPageData(docSnap.data().content);
        } else {
          setPageData(null);
        }
        // Turn off loading screen as soon as we get the initial payload
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching realtime data:", error);
        setLoading(false);
      }
    );

    // Cleanup the listener when we unmount or switch tabs
    return () => unsubscribe();
  }, [activeTab]);

  if (loading) return <div className="w-full h-screen bg-white animate-pulse" />;

  const enhancedAppData = {
    ...appData, // Keep all your existing backend stuff
    registrations, // Add our new table data
    setRegistrations // Add the function to update the table
  };

  return (
    <AppDataContext.Provider value={enhancedAppData}>
      <div key={activeTab} className="w-full relative">
        <Editor resolver={{
          PageRoot, SectionContainer, BannerBlock, GridBlock, SlideshowBlock, AdvancedText, CTAButton, MapBlock, VisionBlock, SiteHeaderBlock, HomeWidgetsBlock, ProgramBlock, RegistrationBlock, PlanningCenterBlock, CountdownBlock, GenericMatrixBlock, CommitteeChecklistBlock, FormBuilderBlock,
          TabsBlock, TabDropZone
        }} enabled={isEditing}>

          {isAdmin && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`fixed bottom-6 z-[120] px-6 py-3 rounded-full font-bold shadow-2xl transition-all duration-300 ${isEditing ? 'bg-rose-500 text-white right-6 md:right-[340px]' : 'bg-slate-900 text-white hover:bg-emerald-600 right-6'}`}
            >
              {isEditing ? "Close Editor" : "✏️ Edit Page"}
            </button>
          )}

          <div className="w-full transition-all duration-300">
            {pageData ? (<Frame data={pageData} />) : (
              <Frame>
                <Element is={PageRoot} canvas>
                  <Element is={SectionContainer} canvas>
                    <AdvancedText text={`Empty Page: ${activeTab}`} align="center" />
                  </Element>
                </Element>
              </Frame>
            )}
          </div>

          {isEditing && <EditorSidebar activeTab={activeTab} />}
        </Editor>
      </div>
    </AppDataContext.Provider>
  );
}

