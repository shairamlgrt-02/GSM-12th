import React from 'react';
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, GripVertical, Plus } from 'lucide-react';
import MapRenderer from './MapRenderer';

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const due = new Date(dateStr);
  return due < today;
};

const AdminDashboard = ({
  setView, handleLogout, adminActiveTab, setAdminActiveTab,
  siteContent, updateSite, homeBlocks, addHomeBlock, moveHomeBlock, updateField, removeItem,
  visionActs, addItem, mapObjects, isBanquet, setIsBanquet,
  masterEvents, activeEventId, setActiveEventId, activeEventSubTab, setActiveEventSubTab, moveRank,
  program, activeProgramId, setActiveProgramId, insertItemAt, onDragStart, onDragOver,
  catering, logisticsCards, committees,
  forms, activeFormId, setActiveFormId, createNewForm, updateFormFields, onQuestionDragStart, onQuestionDragOver, onQuestionDrop,
  responses, regSubTab, setRegSubTab
}) => {
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
          {['home', 'settings', 'vision', 'map', 'program', 'logistics', 'committees', 'registration'].map(t => (
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



{/*==================== SECTION: HOME COMPOSER ====================*/}
          {adminActiveTab === 'home' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-serif italic text-lg text-emerald-900">Home Composer</h3>
                <div className="flex gap-2">
                  <select id="blockTypeSelector" className="text-[9px] font-bold uppercase bg-slate-100 rounded-lg px-2 py-1 outline-none border-none">
                    <option value="hero">Banner</option>
                    <option value="slideshow">Slideshow</option>
                    <option value="countdown">Countdown</option>
                    <option value="grid">Grid</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                  <button
                    onClick={() => addHomeBlock(document.getElementById('blockTypeSelector').value)}
                    className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100"
                  >+ Add</button>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 shadow-sm">
                {homeBlocks.map((block, index) => (
                  <div key={block.id} className="p-2 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => moveHomeBlock(index, 'up')} className="text-slate-300 hover:text-emerald-600"><ChevronUp size={12} /></button>
                        <button onClick={() => moveHomeBlock(index, 'down')} className="text-slate-300 hover:text-emerald-600"><ChevronDown size={12} /></button>
                      </div>

                      <div className="flex-1 flex flex-wrap md:flex-nowrap items-center gap-2 min-w-0">
                        <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase shrink-0">{block.type}</span>

                        <input
                          className="text-[11px] font-bold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-emerald-200 w-32 shrink-0"
                          defaultValue={block.title}
                          onBlur={(e) => updateField('homeBlocks', block.id, { title: e.target.value })}
                        />

                        <input
                          className="flex-1 text-[10px] text-slate-400 bg-transparent border-none outline-none italic truncate min-w-[100px]"
                          placeholder={block.type === 'grid' ? "Main Grid Image (Optional)..." : "URL or Content..."}
                          defaultValue={block.imageUrl || block.content || ""}
                          onBlur={(e) => {
                            const val = e.target.value;
                            // For grids, we explicitly save to imageUrl
                            if (block.type === 'grid') {
                              updateField('homeBlocks', block.id, { imageUrl: val });
                            } else {
                              updateField('homeBlocks', block.id, (block.type === 'text' || block.type === 'countdown') ? { content: val } : { imageUrl: val });
                            }
                          }}
                        />

                        <select
                          className="text-[8px] font-black uppercase bg-transparent text-emerald-600 outline-none cursor-pointer shrink-0"
                          value={block.linkTo || ''}
                          onChange={(e) => updateField('homeBlocks', block.id, { linkTo: e.target.value })}
                        >
                          <option value="">No Link</option>
                          <option value="vision">Vision</option>
                          <option value="map">Map</option>
                          <option value="program">Program</option>
                          <option value="register">Register</option>
                        </select>

                        <button onClick={() => removeItem('homeBlocks', block.id, 'block')} className="text-red-200 hover:text-red-500 font-bold px-2 shrink-0">×</button>
                      </div>
                    </div>

                    {block.type === 'grid' && (
                      <div className="mt-4 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-emerald-800">Grid Cards</span>
                          <button
                            onClick={() => {
                              const newItems = [...(block.items || []), { id: Date.now(), title: '', desc: '', imageUrl: '' }];
                              updateField('homeBlocks', block.id, { items: newItems });
                            }}
                            className="text-[9px] bg-emerald-600 text-white px-2 py-1 rounded-full font-bold"
                          >
                            + Add Card
                          </button>
                        </div>

                        {block.items && block.items.map((item, index) => (
                          <div key={item.id || index} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                            <div className="flex gap-2">
                              <input
                                className="flex-1 text-[9px] font-bold text-slate-700 bg-slate-50 p-1 rounded outline-none"
                                placeholder="Card Title"
                                defaultValue={item.title}
                                onBlur={(e) => {
                                  const newItems = block.items.map((item, i) => 
                                    i === index ? { ...item, title: e.target.value } : item
                                  );
                                  updateField('homeBlocks', block.id, { items: newItems });
                                }}
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== index);
                                  updateField('homeBlocks', block.id, { items: newItems });
                                }}
                                className="text-red-400 text-xs px-2"
                              >
                                ×
                              </button>
                            </div>

                            <input
                              className="w-full text-[9px] text-slate-500 bg-slate-50 p-1 rounded outline-none italic"
                              placeholder="Image URL (i.ibb.co...)"
                              defaultValue={item.imageUrl}
                              onBlur={(e) => {
                                const newItems = block.items.map((item, i) => 
                                  i === index ? { ...item, imageUrl: e.target.value } : item
                                );
                                updateField('homeBlocks', block.id, { items: newItems });
                              }}
                            />

                            <textarea
                              className="w-full text-[9px] text-slate-400 bg-slate-50 p-1 rounded outline-none"
                              placeholder="Description (Optional)"
                              defaultValue={item.desc}
                              onBlur={(e) => {
                                const newItems = [...block.items];
                                newItems[index].desc = e.target.value;
                                updateField('homeBlocks', block.id, { items: newItems });
                              }}
                            />
                            {/* New: CTA Button Text */}
                            <div className="flex gap-2">
                              <input
                                className="flex-1 text-[9px] font-black uppercase text-slate-500 bg-slate-50 p-1.5 rounded outline-none border border-transparent focus:border-emerald-200"
                                placeholder="Button Text (e.g. JOIN NOW)"
                                defaultValue={item.ctaText}
                                onBlur={(e) => {
                                  const newItems = [...block.items];
                                  newItems[index].ctaText = e.target.value;
                                  updateField('homeBlocks', block.id, { items: newItems });
                                }}
                              />

                              {/* New: CTA Button Link */}
                              <input
                                className="flex-1 text-[9px] text-slate-400 bg-slate-50 p-1.5 rounded outline-none border border-transparent focus:border-emerald-200"
                                placeholder="Link (e.g. /register or URL)"
                                defaultValue={item.ctaLink}
                                onBlur={(e) => {
                                  const newItems = [...block.items];
                                  newItems[index].ctaLink = e.target.value;
                                  updateField('homeBlocks', block.id, { items: newItems });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'slideshow' && (
                      <div className="mt-2 ml-8 pl-4 border-l border-emerald-100 space-y-2 pb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] font-black text-emerald-800 uppercase tracking-widest">Slides</span>
                          <button onClick={() => updateField('homeBlocks', block.id, { slides: [...(block.slides || []), { url: '', link: '' }] })} className="text-[7px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">+ Add Slide</button>
                        </div>
                        <div className="space-y-1">
                          {block.slides?.map((slide, i) => (
                            <div key={i} className="flex gap-2 items-center bg-white p-1 rounded border border-slate-50">
                              <input className="text-[9px] text-slate-400 flex-1 outline-none" placeholder="Image URL" defaultValue={slide.url} onBlur={(e) => { let s = [...block.slides]; s[i].url = e.target.value; updateField('homeBlocks', block.id, { slides: s }); }} />
                              <select className="text-[8px] font-bold outline-none bg-transparent" value={slide.link} onChange={(e) => { let s = [...block.slides]; s[i].link = e.target.value; updateField('homeBlocks', block.id, { slides: s }); }}>
                                <option value="">No Link</option><option value="vision">Vision</option><option value="register">Reg</option>
                              </select>
                              <button onClick={() => { let s = block.slides.filter((_, idx) => idx !== i); updateField('homeBlocks', block.id, { slides: s }); }} className="text-red-200 text-[10px]">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}



{/* ==================== SECTION: SETTINGS, BRANDING & TITLES ====================*/}
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
{/* ==================== SECTION: VISION ====================*/}
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



{/* ==================== SECTION: FLOOR MAP ====================*/}
          {adminActiveTab === 'map' && (
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
                  <MapRenderer mode={isBanquet ? 'banquet' : 'service'} mapObjects={mapObjects} isAdminView={true} />
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
                            <input type="number" step="0.1" className="p-1 border border-slate-50 rounded text-[9px] outline-none" defaultValue={obj[f]} onBlur={(e) => updateField('mapObjects', obj.id, { [f]: parseFloat(e.target.value) })} />
                          </div>
                        ))}
                      </div>
                      {obj.type === 'block' && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                          {['rows', 'cols'].map(f => (
                            <div key={f} className="flex flex-col">
                              <label className="text-[6px] font-black uppercase text-slate-300">{f}</label>
                              <input type="number" className="p-1 border border-slate-50 rounded text-[9px] outline-none" defaultValue={obj[f]} onBlur={(e) => updateField('mapObjects', obj.id, { [f]: parseInt(e.target.value) })} />
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



{/* ==================== SECTION: PROGRAM EVENT ITINERARY ====================*/}
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



{/* ==================== SECTION: LOGISTICS CATERING FOOD TRANSPO DECOR ====================*/}
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



{/* ==================== SECTION: COMMITEES TASK RESPONSIBILITIES CHECKLIST ====================*/}
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
                          <textarea className="w-full bg-transparent text-[11px] p-0 border-none outline-none focus:text-emerald-700 font-medium leading-snug resize-none h-6" placeholder="What needs to be done?" defaultValue={t.text}
                          onBlur={(e) => {
  const updatedTasks = comm.tasks.map((task, idx) => 
    idx === i ? { ...task, text: e.target.value } : task
  );
  updateField('committees', comm.id, { tasks: updatedTasks });
}} />
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

         
         
{/* ==================== SECTION: DATABASE & RESPONSES ====================*/}
          {adminActiveTab === 'registration' && (
            <div className="space-y-4 animate-in fade-in max-w-4xl mx-auto">
              <div className="flex gap-4 border-b border-slate-100 mb-2">
                {['builder', 'responses'].map(sub => (
                  <button key={sub} onClick={() => setRegSubTab(sub)} className={`pb-2 text-[9px] font-black uppercase tracking-widest transition-all ${regSubTab === sub ? 'border-b-2 border-emerald-900 text-emerald-900' : 'text-slate-300'}`}>{sub}</button>
                ))}
              </div>

              {regSubTab === 'builder' && (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {forms.map(form => (
                      <button key={form.id} onClick={() => setActiveFormId(form.id)} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeFormId === form.id ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}>{form.title}</button>
                    ))}
                    <button onClick={createNewForm} className="px-3 py-1.5 border border-dashed rounded-lg text-[9px] font-black text-slate-300 hover:bg-slate-50">+ New Form</button>
                  </div>

                  {activeFormId && (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="p-2 bg-slate-50 border-b flex justify-between items-center px-4">
                        <input className="bg-transparent font-bold text-emerald-900 text-[11px] outline-none" defaultValue={forms.find(f => f.id === activeFormId)?.title} onBlur={(e) => updateField('forms', activeFormId, { title: e.target.value })} />
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateField('forms', activeFormId, { isVisible: !forms.find(f => f.id === activeFormId)?.isVisible })} className="text-slate-400">
                            {forms.find(f => f.id === activeFormId)?.isVisible ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} />}
                          </button>
                          <button onClick={() => {
                            const currentForm = forms.find(f => f.id === activeFormId);
                            updateFormFields(activeFormId, [...(currentForm.fields || []), { id: Date.now().toString(), type: 'text', label: 'New Question', required: false, options: [] }]);
                          }} className="text-[8px] font-black uppercase text-emerald-700 bg-white px-2 py-1 rounded border shadow-sm">+ Question</button>
                          <button onClick={() => { if (window.confirm('Delete form?')) { removeItem('forms', activeFormId, 'form'); setActiveFormId(null); } }} className="text-red-300 font-bold px-1">×</button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-50">
                        {forms.find(f => f.id === activeFormId)?.fields?.map((field, idx) => (
                          <div
                            key={field.id}
                            draggable
                            onDragStart={(e) => onQuestionDragStart(e, idx)}
                            onDragOver={onQuestionDragOver}
                            onDrop={(e) => onQuestionDrop(e, idx, activeFormId)}
                            className="p-2 px-4 hover:bg-slate-50/50 transition-colors cursor-grab active:cursor-grabbing group border-b border-slate-50 last:border-none"
                          >
                            <div className="flex items-center gap-3">
                              {/* THE GRIP HANDLE */}
                              <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <GripVertical size={14} />
                              </div>

                              <input
                                className="flex-1 text-[10px] font-bold text-slate-700 outline-none bg-transparent"
                                defaultValue={field.label}
                                onBlur={(e) => {
                                  let fs = [...forms.find(f => f.id === activeFormId).fields];
                                  fs[idx].label = e.target.value;
                                  updateFormFields(activeFormId, fs);
                                }}
                              />

                              <select
                                className="text-[8px] font-black uppercase bg-slate-100 rounded px-1.5 py-0.5 outline-none border-none text-slate-500"
                                value={field.type}
                                onChange={(e) => {
                                  let fs = [...forms.find(f => f.id === activeFormId).fields];
                                  fs[idx].type = e.target.value;
                                  updateFormFields(activeFormId, fs);
                                }}
                              >
                                <option value="text">Short</option>
                                <option value="paragraph">Long</option>
                                <option value="dropdown">Drop</option>
                                <option value="radio">Choice</option>
                                <option value="checkbox">Check</option>
                              </select>

                              <button
                                onClick={() => {
                                  let fs = forms.find(f => f.id === activeFormId).fields.filter(f => f.id !== field.id);
                                  updateFormFields(activeFormId, fs);
                                }}
                                className="text-red-200 hover:text-red-500 font-bold px-1"
                              >
                                ×
                              </button>
                            </div>

                            {(field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox') && (
                              <div className="mt-1 ml-6">
                                <input
                                  className="w-full bg-transparent border-b border-dashed border-slate-100 text-[9px] text-emerald-600 outline-none italic"
                                  placeholder="Options separated by commas..."
                                  defaultValue={field.options?.join(', ')}
                                  onBlur={(e) => {
                                    let fs = [...forms.find(f => f.id === activeFormId).fields];
                                    fs[idx].options = e.target.value.split(',').map(s => s.trim()).filter(s => s !== "");
                                    updateFormFields(activeFormId, fs);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {regSubTab === 'responses' && (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {forms.map(form => (
                      <button key={form.id} onClick={() => setActiveFormId(form.id)} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeFormId === form.id ? 'bg-emerald-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{form.title}</button>
                    ))}
                  </div>

                  {activeFormId && (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="p-2 bg-slate-50 border-b flex justify-between items-center px-4">
                        <span className="text-[9px] font-black text-emerald-900 uppercase">Records: {responses.filter(r => r.formTitle === forms.find(f => f.id === activeFormId)?.title).length}</span>
                        <button onClick={() => {
                          const f = forms.find(f => f.id === activeFormId);
                          const r = responses.filter(res => res.formTitle === f.title);
                          const csv = "Date,Status," + f.fields.map(field => field.label).join(",") + "\n" + r.map(res => [new Date(res.submittedAt).toLocaleDateString(), res.status, ...f.fields.map(field => res[field.label] || '')].join(",")).join("\n");
                          const link = document.createElement("a"); link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + csv)); link.setAttribute("download", `${f.title}_Export.csv`); link.click();
                        }} className="text-[8px] font-black uppercase text-emerald-700 bg-white px-2 py-1 rounded border shadow-sm italic">Export CSV</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="p-3 text-[7px] font-black uppercase text-slate-400">Status</th>
                              {forms.find(f => f.id === activeFormId)?.fields?.map(f => (
                                <th key={f.id} className="p-3 text-[7px] font-black uppercase text-slate-400 whitespace-nowrap">{f.label}</th>
                              ))}
                              <th className="p-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {responses.filter(r => r.formTitle === forms.find(f => f.id === activeFormId)?.title).map(res => (
                              <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                  <button
                                    onClick={() => updateField('responses', res.id, {
                                      status: res.status === 'Confirmed' ? 'Pending' : 'Confirmed'
                                    })}
                                    className={`group relative w-16 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${res.status === 'Confirmed' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                  >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${res.status === 'Confirmed' ? 'translate-x-10' : 'translate-x-0'}`} />
                                    <span className={`absolute text-[6px] font-black uppercase transition-all ${res.status === 'Confirmed' ? 'left-2 text-white' : 'right-2 text-slate-400'}`}>
                                      {res.status === 'Confirmed' ? 'Confirm' : 'Pending'}
                                    </span>
                                  </button>
                                </td>
                                {forms.find(f => f.id === activeFormId)?.fields?.map(f => (
                                  <td key={f.id} className="p-3 text-[9px] font-bold text-slate-600">{res[f.label] || '-'}</td>
                                ))}
                                <td className="p-3 text-right">
                                  <button onClick={() => removeItem('responses', res.id, 'response')} className="text-red-200 font-bold">×</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main >
    </div >

  );
};

export default AdminDashboard;