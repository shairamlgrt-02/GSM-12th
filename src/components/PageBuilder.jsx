import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ==========================================
// 1. ADVANCED BLOCKS & SETTINGS (Same as before)
// ==========================================
const HeaderSettings = () => {
  const { setProp, text, colorHex, fontSize, align } = useNode((node) => ({
    text: node.data.props.text, colorHex: node.data.props.colorHex, fontSize: node.data.props.fontSize, align: node.data.props.align
  }));
  return (
    <div className="flex flex-col gap-4 text-sm">
      <textarea value={text} onChange={(e) => setProp((p) => p.text = e.target.value)} className="border p-2 rounded w-full" />
      <input type="color" value={colorHex} onChange={(e) => setProp((p) => p.colorHex = e.target.value)} className="w-full" />
      <input type="range" min="1" max="10" step="0.5" value={fontSize} onChange={(e) => setProp((p) => p.fontSize = parseFloat(e.target.value))} className="w-full" />
      <select value={align} onChange={(e) => setProp((p) => p.align = e.target.value)} className="border p-2 rounded w-full">
        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
      </select>
    </div>
  );
};

const ChurchHeader = ({ text, colorHex, fontSize, align }) => {
  const { connectors: { connect, drag }, selected, isEditing } = useNode((node) => ({
    selected: node.events.selected
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const responsiveFontSize = `clamp(${fontSize * 0.4}rem, ${fontSize * 0.8}vw, ${fontSize}rem)`;

  return (
    <div ref={(ref) => enabled ? connect(drag(ref)) : null} className={`p-2 transition-all ${selected && enabled ? 'ring-2 ring-blue-500 rounded bg-blue-50/10' : ''}`}>
      <h2 className="font-serif italic tracking-tight leading-none" style={{ color: colorHex, fontSize: responsiveFontSize, textAlign: align }}>
        {text}
      </h2>
    </div>
  );
};
ChurchHeader.craft = { props: { text: "Epic Custom Title", colorHex: "#1B4332", fontSize: 4, align: "left" }, related: { settings: HeaderSettings } };

const ResizableSettings = () => {
  const { setProp, bgColor, padding, layoutDirection, justify, align } = useNode((node) => ({
    bgColor: node.data.props.bgColor, padding: node.data.props.padding, layoutDirection: node.data.props.layoutDirection, justify: node.data.props.justify, align: node.data.props.align
  }));
  return (
    <div className="flex flex-col gap-4 text-sm">
      <select value={layoutDirection} onChange={(e) => setProp((p) => p.layoutDirection = e.target.value)} className="border p-2 rounded w-full"><option value="column">Stack Vertical</option><option value="row">Stack Horizontal</option></select>
      <select value={justify} onChange={(e) => setProp((p) => p.justify = e.target.value)} className="border p-2 rounded w-full"><option value="flex-start">Align Left/Top</option><option value="center">Center</option><option value="flex-end">Align Right/Bottom</option></select>
      <select value={align} onChange={(e) => setProp((p) => p.align = e.target.value)} className="border p-2 rounded w-full"><option value="flex-start">Align Top/Left</option><option value="center">Center</option><option value="flex-end">Align Bottom/Right</option></select>
      <input type="color" value={bgColor} onChange={(e) => setProp((p) => p.bgColor = e.target.value)} className="w-full" />
      <input type="range" min="0" max="10" step="1" value={padding} onChange={(e) => setProp((p) => p.padding = parseInt(e.target.value))} className="w-full" />
    </div>
  );
};

const ResizableSection = ({ bgColor, padding, layoutDirection, justify, align, children }) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

  return (
    <div
      ref={(ref) => enabled ? connect(drag(ref)) : null}
      className={`relative transition-all w-full ${enabled ? 'border-2 border-dashed border-slate-300 min-h-[100px]' : ''} ${selected && enabled ? 'ring-4 ring-blue-500 z-10' : ''}`}
      style={{
        backgroundColor: bgColor, padding: `${padding}rem`, display: 'flex', flexDirection: layoutDirection, justifyContent: justify, alignItems: align, gap: '1rem',
        resize: enabled ? 'both' : 'none', overflow: enabled ? 'hidden' : 'visible'
      }}
    >
      {enabled && <span className="absolute top-2 left-2 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">Section</span>}
      {children}
    </div>
  );
};
ResizableSection.craft = { props: { bgColor: "#ffffff", padding: 2, layoutDirection: "column", justify: "flex-start", align: "flex-start" }, related: { settings: ResizableSettings } };

// ==========================================
// 2. SIDEBAR PANELS (Hidden when not editing)
// ==========================================
const EditorSidebar = () => {
  const { connectors, query, actions, selected } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selectedSettings;
    if (currentNodeId) selectedSettings = state.nodes[currentNodeId].related?.settings;
    return { selected: selectedSettings };
  });

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "sandbox", "pro-design"), { content: query.serialize() });
      alert("Changes published to live site!");
    } catch (error) { alert("Error saving."); }
  };

  return (
    <div className="w-80 h-screen bg-slate-900 text-white fixed top-0 right-0 shadow-2xl flex flex-col z-50 overflow-y-auto">
      <div className="p-6 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
        <span className="font-bold tracking-wider text-sm uppercase">Site Editor</span>
        <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-bold px-4 py-2 rounded-full transition">Publish</button>
      </div>

      <div className="p-6 border-b border-slate-700">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Add Elements</h3>
        <div className="flex flex-col gap-2">
          <button ref={(ref) => connectors.create(ref, <ChurchHeader text="New Title" />)} className="p-3 bg-slate-800 rounded border border-slate-700 text-left text-sm cursor-grab hover:bg-slate-700">+ Header Text</button>
          <button ref={(ref) => connectors.create(ref, <Element is={ResizableSection} canvas />)} className="p-3 bg-slate-800 rounded border border-slate-700 text-left text-sm cursor-grab hover:bg-slate-700">+ Flex Section</button>
        </div>
      </div>

      <div className="p-6 flex-1">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Inspector</h3>
        {selected ? React.createElement(selected) : <p className="text-xs text-slate-500 italic">Click an element on the page to edit its properties.</p>}
      </div>
    </div>
  );
};

// ==========================================
// 3. THE UNIFIED WEBSITE VIEWER
// ==========================================
export default function UnifiedWebsite({ isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the live site data when the page loads
  useEffect(() => {
    const loadData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "sandbox", "pro-design"));
        if (docSnap.exists()) setPageData(docSnap.data().content);
      } catch (error) { console.error(error); }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading Website...</div>;

  return (
    <div className="min-h-screen bg-white relative">
      {/* THE MAGIC: We pass isEditing to the enabled prop! */}
      <Editor resolver={{ ResizableSection, ChurchHeader }} enabled={isEditing}>

        {/* THE SAFETY CHECK: This button only exists if isAdmin is true */}
        {isAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`fixed bottom-6 left-6 z-50 px-6 py-3 rounded-full font-bold shadow-xl transition-all ${isEditing ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}
          >
            {isEditing ? "Close Editor" : "✏️ Edit Site"}
          </button>
        )}

        {/* The Live Website Viewport */}
        <div className={`transition-all duration-300 ${isEditing ? 'pr-80' : 'pr-0'}`}>
          {pageData ? (
            <Frame data={pageData} />
          ) : (
            <Frame>
              <Element is={ResizableSection} canvas>
                <ChurchHeader text="Welcome to the Live Site!" />
              </Element>
            </Frame>
          )}
        </div>

        {/* Sidebar only renders if we clicked the Edit button */}
        {isEditing && <EditorSidebar />}

      </Editor>
    </div>
  );
}