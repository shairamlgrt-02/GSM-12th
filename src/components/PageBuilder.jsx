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
// 2. SIDEBAR PANELS (Fully Responsive Now)
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
    // REMOVED 'fixed w-80 h-screen'. It now fills whatever container it is placed in (h-full w-full).
    <div className="w-full h-full bg-slate-900 text-white flex flex-col z-50 overflow-y-auto">
      <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800 flex justify-between items-center sticky top-0 z-10">
        <span className="font-bold tracking-wider text-xs md:text-sm uppercase">Site Editor</span>
        <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-[10px] md:text-xs font-bold px-4 py-2 rounded-full transition">Publish</button>
      </div>

      <div className="p-4 md:p-6 border-b border-slate-700">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Add Elements</h3>
        <div className="flex flex-col gap-2">
          <button ref={(ref) => connectors.create(ref, <ChurchHeader text="New Title" />)} className="p-3 bg-slate-800 rounded border border-slate-700 text-left text-xs md:text-sm cursor-grab hover:bg-slate-700 transition">+ Header Text</button>
          <button ref={(ref) => connectors.create(ref, <Element is={ResizableSection} canvas />)} className="p-3 bg-slate-800 rounded border border-slate-700 text-left text-xs md:text-sm cursor-grab hover:bg-slate-700 transition">+ Flex Section</button>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Inspector</h3>
        {selected ? React.createElement(selected) : <p className="text-xs text-slate-500 italic">Click an element on the page to edit.</p>}
      </div>
    </div>
  );
};

// ==========================================
// 3. THE UNIFIED WEBSITE VIEWER (Responsive Wrapper)
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

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Loading Website...</div>;

  return (
    // If NOT editing, normal page flow. If EDITING, lock screen height and use flexbox.
    <div className={isEditing ? "h-screen w-full overflow-hidden bg-slate-100" : "min-h-screen w-full bg-white relative"}>
      <Editor resolver={{ ResizableSection, ChurchHeader }} enabled={isEditing}>

        {/* THE EDIT TOGGLE BUTTON - Now responsive for mobile screens */}
        {isAdmin && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`fixed bottom-4 left-4 md:bottom-6 md:left-6 z-[60] px-4 py-2 md:px-6 md:py-3 text-xs md:text-base rounded-full font-bold shadow-xl transition-all ${isEditing ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}
          >
            {isEditing ? "Close Editor" : "✏️ Edit Site"}
          </button>
        )}

        {/* RESPONSIVE EDITING LAYOUT */}
        <div className={`transition-all duration-300 w-full h-full ${isEditing ? 'flex flex-col md:flex-row' : 'block'}`}>
          
          {/* THE CANVAS AREA */}
          <div className={`${isEditing ? 'flex-1 overflow-y-auto p-2 md:p-8' : 'w-full'}`}>
            {/* When editing, the canvas looks like a piece of paper. When live, it takes up the whole screen. */}
            <div className={`${isEditing ? 'w-full max-w-6xl mx-auto bg-white min-h-[80vh] shadow-sm rounded-xl border border-slate-200 pb-20' : 'w-full'}`}>
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
          </div>

          {/* THE SIDEBAR CONTAINER - 40% height on mobile, 320px width on desktop */}
          {isEditing && (
            <div className="w-full md:w-80 h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-slate-700 shadow-2xl flex-shrink-0">
              <EditorSidebar />
            </div>
          )}

        </div>

      </Editor>
    </div>
  );
}