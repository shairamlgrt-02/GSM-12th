import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
                <div onClick={() => setActiveProgramId && setActiveProgramId(activeProgramId === row.id ? null : row.id)} className="flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-all">
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
          {logisticsCards && logisticsCards.filter(c => c.parentId === activeEventSubTab).map(card => (
            <div key={card.id} className="bg-white p-5 rounded-xl border border-slate-100 border-t-[4px] border-[#C5A021] shadow-sm">
              <h4 className="font-bold text-emerald-900 uppercase text-[9px] mb-2 tracking-widest italic opacity-40">{card.title}</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium whitespace-pre-line tracking-tight">{card.desc}</p>
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


// 9. CREATE THE PLANNING CENTER BLOCK
const PlanningCenterBlock = () => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  const {
    isPrivateUnlocked, setIsPrivateUnlocked, passInput, setPassInput, internalSubTab, setInternalSubTab,
    siteContent, catering, logisticsCards, committees, updateField, isOverdue
  } = useContext(AppDataContext) || {};

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-purple-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-purple-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Planning Center</span>}
      <div className={`${enabled ? 'pointer-events-none' : ''}`}>

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
                    className="w-full bg-slate-50 border border-transparent focus:border-emerald-100 rounded-2xl px-6 py-4 text-center text-emerald-900 tracking-[0.3em] outline-none transition-all"
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
              {/* SUB-NAV */}
              <div className="flex bg-emerald-900/5 p-1 rounded-xl gap-2 shadow-inner mb-10 max-w-lg mx-auto">
                <button
                  onClick={() => setInternalSubTab && setInternalSubTab('logistics')}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'logistics' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                >
                  Logistics
                </button>
                <button
                  onClick={() => setInternalSubTab && setInternalSubTab('committees')}
                  className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${internalSubTab === 'committees' ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/40 hover:text-emerald-900'}`}
                >
                  Committees
                </button>
              </div>

              {/* LOGISTICS CONTENT */}
              {(internalSubTab === 'logistics' || !internalSubTab) && (
                <div className="animate-in fade-in pt-0 space-y-6">
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
                            const overdue = !t.completed && isOverdue && isOverdue(t.dueDate);
                            return (
                              <div key={i} className={`p-3 rounded-lg border border-slate-50 transition-all duration-500 ${t.completed ? 'bg-slate-50 opacity-40 grayscale' : 'bg-white shadow-sm'}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 accent-emerald-600 w-3.5 h-3.5 rounded"
                                    checked={t.completed || false}
                                    onChange={async () => {
                                      if (updateField) {
                                        const nt = [...comm.tasks];
                                        nt[i].completed = !nt[i].completed;
                                        await updateField('committees', comm.id, { tasks: nt });
                                      }
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

      </div>
    </div>
  );
};
PlanningCenterBlock.craft = { rules: { canDrag: () => true } };


// 10. CREATE THE STANDALONE COUNTDOWN SETTINGS & BLOCK
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


// 11. CREATE THE GENERIC MATRIX SETTINGS & BLOCK
const GenericMatrixSettings = () => {
  const { title, columns, rows, actions: { setProp } } = useNode((node) => ({
    title: node.data.props.title,
    columns: node.data.props.columns,
    rows: node.data.props.rows
  }));

  // Column Handlers
  const addColumn = () => setProp(p => {
    p.columns.push(`Col ${p.columns.length + 1}`);
    p.rows.forEach(row => row.push("")); // Add an empty cell to every existing row
  });
  const updateColumn = (index, val) => setProp(p => p.columns[index] = val);
  const removeColumn = (index) => setProp(p => {
    p.columns.splice(index, 1);
    p.rows.forEach(row => row.splice(index, 1)); // Remove that cell from every row
  });

  // Row Handlers
  const addRow = () => setProp(p => p.rows.push(new Array(p.columns.length).fill("")));
  const updateCell = (rowIndex, colIndex, val) => setProp(p => p.rows[rowIndex][colIndex] = val);
  const removeRow = (index) => setProp(p => p.rows.splice(index, 1));

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matrix Title</label>
        <input type="text" value={title || ''} onChange={(e) => setProp(p => p.title = e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 text-xs focus:border-blue-500 outline-none" />
      </div>

      {/* MANAGE COLUMNS */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Columns</label>
        {columns.map((col, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" value={col} onChange={(e) => updateColumn(i, e.target.value)} className="flex-1 bg-slate-900 text-white border border-slate-700 rounded p-2 text-xs focus:border-blue-500 outline-none" />
            <button onClick={() => removeColumn(i)} className="bg-red-500/20 text-red-500 px-2 rounded hover:bg-red-500 hover:text-white text-xs transition-colors">✕</button>
          </div>
        ))}
        <button onClick={addColumn} className="w-full py-1.5 bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 text-[10px] font-black uppercase mt-1 hover:bg-blue-900/60 transition-colors">+ Add Column</button>
      </div>

      {/* MANAGE ROWS */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Rows</label>
        {rows.map((row, rIndex) => (
          <div key={rIndex} className="p-3 bg-slate-800 border border-slate-700 rounded-lg mb-3 relative">
            <button onClick={() => removeRow(rIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold hover:bg-red-600 z-10">✕</button>
            <div className="space-y-2">
              {columns.map((col, cIndex) => (
                <div key={cIndex}>
                  <span className="text-[8px] uppercase text-slate-500 block mb-1">{col}</span>
                  <input type="text" value={row[cIndex] || ""} onChange={(e) => updateCell(rIndex, cIndex, e.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-xs focus:border-blue-500 outline-none" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-2 bg-emerald-900/40 text-emerald-400 rounded-lg border border-emerald-900/50 text-[10px] font-black uppercase mt-1 hover:bg-emerald-900/60 transition-colors">+ Add Row</button>
      </div>
    </div>
  );
};

const GenericMatrixBlock = ({ title, columns, rows }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({ selected: state.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`relative w-full transition-all ${enabled ? 'border-2 border-dashed border-blue-300 py-4 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-blue-500 z-10' : ''}`}>
      {enabled && <span className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Matrix Data</span>}

      <div className={`bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden max-w-5xl mx-auto ${enabled ? 'pointer-events-none' : ''}`}>
        <div className="bg-slate-800 p-4">
          <h3 className="font-serif italic text-white text-lg tracking-tight leading-none text-center">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns && columns.map((col, i) => (
                  <th key={i} className="p-3 text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows && rows.length > 0 ? rows.map((row, rIndex) => (
                <tr key={rIndex} className="hover:bg-slate-50 transition-colors">
                  {columns && columns.map((_, cIndex) => (
                    <td key={cIndex} className="p-3 text-[12px] font-medium text-slate-700">{row[cIndex]}</td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={columns?.length || 1} className="p-8 text-center text-slate-400 text-xs italic">No data rows added.</td>
                </tr>
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
    title: "Custom Data Matrix",
    columns: ["Item", "Quantity", "Assigned To"],
    rows: [
      ["Tables", "10", "Sarah"],
      ["Chairs", "50", "Mike"]
    ]
  },
  related: { settings: GenericMatrixSettings },
  rules: { canDrag: () => true }
};


// 12. CREATE THE COMMITTEE CHECKLIST SETTINGS & BLOCK
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
      className={`relative w-full flex items-center justify-center overflow-hidden transition-all ${rounding} ${enabled ? 'border-2 border-dashed border-purple-300' : ''} ${selected && enabled ? 'ring-4 ring-purple-500 z-10' : ''}`}
      style={{ aspectRatio: aspect, minHeight: aspect === 'auto' ? '250px' : 'auto', ...backgroundStyle }}
    >
      {enabled && <span className="absolute top-0 left-0 bg-purple-500 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-20 pointer-events-none">Banner</span>}
      <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }}></div>
      <div className="relative z-10 w-full max-w-4xl mx-auto p-8 flex flex-col items-center text-center gap-4">{children}</div>
    </div>
  );
};
BannerBlock.craft = { props: { bgType: "image", bgImage: "https://images.unsplash.com/photo-1438259183166-4df4f3f0194b?q=80&w=2000", bgColor: "#1e293b", overlayOpacity: 0.4, aspect: "16 / 9", rounding: "rounded-none" }, related: { settings: BannerSettings } };

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

  return (
    <AppDataContext.Provider value={appData}>
      <div key={activeTab} className="w-full relative">
        <Editor resolver={{
          PageRoot, SectionContainer, BannerBlock, GridBlock, SlideshowBlock, AdvancedText, CTAButton, MapBlock, VisionBlock, SiteHeaderBlock, HomeWidgetsBlock, ProgramBlock, RegistrationBlock, PlanningCenterBlock, CountdownBlock, GenericMatrixBlock, CommitteeChecklistBlock
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