import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// 1. IMPORT YOUR CUSTOM COMPONENTS
import MapRenderer from './MapRenderer';
import VisionSection from './VisionSection';

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

        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">App Components</h3>
        <div className="grid grid-cols-2 gap-2">
          <button ref={(ref) => connectors.create(ref, <MapBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-blue-400 font-bold">+ Map Layout</button>
          <button ref={(ref) => connectors.create(ref, <VisionBlock />)} className="p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-grab hover:bg-slate-700 text-indigo-400 font-bold">+ Vision Area</button>
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
        <Editor resolver={{ PageRoot, SectionContainer, BannerBlock, GridBlock, SlideshowBlock, AdvancedText, CTAButton, MapBlock, VisionBlock }} enabled={isEditing}>

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