import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';

export default function ChurchPortal() {
  const [activeTab, setActiveTab] = useState('vision');
  const [isBanquet, setIsBanquet] = useState(false);

  // --- DATA STATES (Initialized with your FULL CONTENT) ---
  const [program, setProgram] = useState([
    {
      time: '1:00 PM',
      activity:
        'Doors Open. Ambient music; guests engage with Restoration Wall (Tag tying).',
      style: 'bg-white',
    },
    {
      time: '1:30 PM',
      activity: 'Welcome & Declaration (Host Minerva) / Acoustic Prelude.',
      style: 'bg-white',
    },
    { time: '1:35 PM', activity: 'Opening Prayer.', style: 'bg-white' },
    {
      time: '1:40 PM',
      activity: 'Praise & Worship (Full Band - "Revive" anthems).',
      style: 'bg-emerald-50/50 font-bold',
    },
    { time: '2:10 PM', activity: 'Opening Remarks.', style: 'bg-white' },
    {
      time: '2:15 PM',
      activity:
        "Church History / Highlights (Screening: Shaira & Jeg's 12-Year History Video).",
      style: 'bg-white',
    },
    {
      time: '2:25 PM',
      activity: 'Anniversary Message (Pastor Benny).',
      style: 'bg-white font-bold',
    },
    { time: '3:05 PM', activity: 'Altar Call.', style: 'bg-white' },
    {
      time: '3:15 PM',
      activity: 'Tithes & Offerings (Collection).',
      style: 'bg-white text-emerald-700 font-medium',
    },
    {
      time: '3:25 PM',
      activity: 'ORDINATION CEREMONY (LEADERS SURROUND THE STAGE).',
      style: 'bg-white font-bold uppercase tracking-tight',
    },
    {
      time: '3:40 PM',
      activity:
        "Member Testimonies (Screening: Shaira & Jeg's 2-minute testimony videos).",
      style: 'bg-white',
    },
    {
      time: '3:50 PM',
      activity: 'Presentations (Salmabad, Mizpah, Kids).',
      style: 'bg-white',
    },
    { time: '4:10 PM', activity: 'Closing Remarks.', style: 'bg-white' },
    {
      time: '4:15 PM',
      activity: 'Announcements & Benediction.',
      style: 'bg-white',
    },
    {
      time: '4:20 PM',
      activity: 'Victory Song (Full Triumphant Praise).',
      style: 'bg-white',
    },
    {
      time: '4:25 PM',
      activity: 'SERVICE ENDS / 5-MINUTE ROOM FLIP TO BANQUET STARTS.',
      style: 'bg-orange-50 font-bold text-orange-900 uppercase',
    },
  ]);

  const [committees, setCommittees] = useState([
    {
      color: 'border-emerald-900',
      title: 'Media',
      team: 'Shaira, Jeg, Kerk',
      tasks: [
        '12-Year History Documentary (Due May 20)',
        'Member Testimony Videos (Color-graded)',
        'Lower-third Graphics for Videos',
        'Livestream Mixer & Holding Screens (Kerk)',
        'AV Rehearsal/Playback Check (May 28)',
      ],
    },
    {
      color: 'border-[#C5A021]',
      title: 'Design',
      team: 'Matet, Bhim, Deon',
      tasks: [
        '14-day WhatsApp Fasting Graphics (May 16)',
        'Official Logo/Branding Assets (Illustrator)',
        'Restoration Wall Physical Tag Design',
        'Emerald/Cream T-shirt Size Matrix (Bhim)',
        'T-shirt Payment Collection (Due May 8)',
      ],
    },
    {
      color: 'border-blue-900',
      title: 'Documentation',
      team: 'CJ & Kitkat',
      tasks: [
        'Raw Digital/iPhone Aesthetic Photos',
        'Avoid Heavy Processed/Film Filters',
        'Live Event Photo Coverage (Worship & Banquet)',
        'Community Fellowship Snapshots',
      ],
    },
    {
      color: 'border-emerald-600',
      title: 'Transportation',
      team: 'Sis Bhing',
      tasks: [
        'Lock Bus & Van Routes by May 15',
        'Pickup Points: Burhama, Sanabis, Gudabiya',
        'Vehicle Arrival at Manama (Strict 1:00 PM)',
        'Passenger Manifest based on RSVP',
      ],
    },
    {
      color: 'border-orange-400',
      title: 'Stage Decor & Ambience',
      team: 'Pastor Benny Setup',
      tasks: [
        'Emerald & Gold Backdrop Installation',
        'Floral/Greenery Arrangements for Altar',
        'Restoration Wall Physical Setup',
        'Stage Lighting Focus (Warm/Gold mix)',
      ],
    },
    {
      color: 'border-gray-400',
      title: 'Cleaning & Maintenance',
      team: 'General Volunteers',
      tasks: [
        'Pre-Event Hall Sanitization (Morning)',
        'Restroom Maintenance during Service',
        'Banquet Waste Collection Management',
        'Post-Event Hall Clearing & Sweep',
      ],
    },
    {
      color: 'border-teal-600',
      title: 'Ushering & Ops',
      team: 'Sis Marlyn',
      tasks: [
        '106 Green vs 12 Yellow Seating Briefing',
        'Ground Floor Elevator Usher Dispatch',
        'Restoration Tag Handout & Assist',
        '5-Minute Room Flip Drill (4:25 PM Transition)',
      ],
    },
    {
      color: 'border-red-500',
      title: 'Worship & Tech',
      team: 'Worship Team',
      tasks: [
        'Setlist Submission (Rebuild/Revive/Reign)',
        'Acoustic Prelude vs Full Band Balance',
        'May 28 Full Technical Run-through',
        'Victory Song Transition Practice',
      ],
    },
  ]);

  const [catering, setCatering] = useState([
    { group: 'Esther', dish: 'Lechon Kawali', confirmed: true },
    { group: 'Gudaibiya', dish: 'To be confirmed', confirmed: false },
    { group: 'Salmabad', dish: 'To be confirmed', confirmed: false },
    { group: 'Mizpah', dish: 'Pinaupong Manok', confirmed: true },
    { group: 'Burhama', dish: 'To be confirmed', confirmed: false },
    { group: 'Sanabis', dish: 'To be confirmed', confirmed: false },
  ]);

  // Firebase Real-time Sync (Optional: switches to DB content if it exists)
  useEffect(() => {
    const qProgram = query(collection(db, 'program'), orderBy('time'));
    const unsubProg = onSnapshot(qProgram, (snap) => {
      if (!snap.empty) setProgram(snap.docs.map((d) => d.data()));
    });
    const unsubComm = onSnapshot(collection(db, 'committees'), (snap) => {
      if (!snap.empty) setCommittees(snap.docs.map((d) => d.data()));
    });
    const unsubCat = onSnapshot(collection(db, 'catering'), (snap) => {
      if (!snap.empty) setCatering(snap.docs.map((d) => d.data()));
    });
    return () => {
      unsubProg();
      unsubComm();
      unsubCat();
    };
  }, []);

  const migrateToFirebase = async () => {
    const batch = writeBatch(db);
    program.forEach((item, i) =>
      batch.set(doc(db, 'program', `row_${i}`), item)
    );
    committees.forEach((item, i) =>
      batch.set(doc(db, 'committees', `comm_${i}`), item)
    );
    catering.forEach((item, i) =>
      batch.set(doc(db, 'catering', `cat_${i}`), item)
    );
    await batch.commit();
    alert('Full site content migrated to Firebase!');
  };

  // --- MAP LOGIC ---
  const renderServiceDots = () => {
    const dots = [];
    const drawBlock = (startX, startY, cols, rows, isLead) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push(
            <div
              key={`dot-${startX}-${startY}-${r}-${c}`}
              className={`absolute w-2 h-2 rounded-sm border z-20 ${
                isLead
                  ? 'bg-[#fef08a] border-[#854d0e]'
                  : 'bg-[#86efac] border-[#166534]'
              }`}
              style={{
                left: `${startX + c * 2.8}%`,
                top: `${startY + r * 4.2}%`,
              }}
            />
          );
        }
      }
    };
    drawBlock(19, 15, 4, 6, false);
    drawBlock(31.5, 15, 4, 6, false);
    drawBlock(45, 12, 4, 7, false);
    drawBlock(61, 12, 4, 4, false);
    drawBlock(61, 35, 4, 3, false);
    drawBlock(80.5, 52.5, 4, 3, true);
    return dots;
  };

  const renderBanquetLayout = () => {
    const tables = [
      { x: 22, y: 23, w: 11, h: 15 },
      { x: 38.5, y: 23, w: 11, h: 15 },
      { x: 55, y: 23, w: 11, h: 15 },
      { x: 73, y: 17, w: 10, h: 18 },
      { x: 73, y: 43, w: 10, h: 18 },
    ];
    const freeAreas = [
      { x: 16.5, y: 14, w: 1.5, h: 30 },
      { x: 21.5, y: 12, w: 18, h: 3 },
      { x: 45, y: 10, w: 25, h: 4 },
      { x: 59, y: 40, w: 13, h: 4 },
      { x: 40, y: 46, w: 10, h: 3 },
      { x: 72, y: 60, w: 10, h: 4 },
      { x: 80, y: 51, w: 10, h: 12 },
    ];
    return (
      <>
        {tables.map((t, i) => (
          <div
            key={`tbl-${i}`}
            className="absolute bg-[#e67e22] border border-[#d35400] z-25 rounded-sm"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.w}%`,
              height: `${t.h}%`,
            }}
          />
        ))}
        {freeAreas.map((a, i) => (
          <div
            key={`free-${i}`}
            className="absolute bg-[#4ade80] opacity-80 border border-[#166534] z-24"
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              width: `${a.w}%`,
              height: `${a.h}%`,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCFBF4] font-sans text-[#2D2D2D]">
      {/* NAVIGATION */}
      <nav className="fixed w-full z-50 bg-white border-b border-gray-200 px-2 md:px-6 h-14 md:h-16 flex items-center shadow-sm">
        <div className="font-bold text-emerald-900 text-[10px] md:text-xl tracking-tighter flex-shrink-0 w-[20%]">
          GSM <span className="font-light italic text-[#C5A021]">12th</span>
        </div>
        <div className="flex justify-between items-center w-[80%] pr-1 md:pr-0">
          {['vision', 'floor', 'program', 'logistics', 'checklist'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[6.5px] md:text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-all border-b-2 py-1 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-emerald-800 text-emerald-800'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {tab === 'floor'
                  ? 'Map'
                  : tab === 'checklist'
                  ? 'Committees'
                  : tab}
              </button>
            )
          )}
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-7xl mx-auto pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif text-emerald-900 mb-2 italic">
            God of Restoration
          </h1>
          <p className="text-[#C5A021] font-bold tracking-[0.3em] text-xs md:text-sm mb-4">
            REBUILD • REVIVE • REIGN
          </p>
          <p className="text-emerald-800 font-serif italic text-xl md:text-2xl opacity-80">
            "And to the masons, and hewers of stone..." — 2 Kings 12:12
          </p>
        </div>

        {/* VISION */}
        {activeTab === 'vision' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-serif mb-8 text-[#C5A021]">
                The 4 Spiritual Pillars
              </h2>
              <div className="space-y-8">
                {[
                  {
                    title: '1. Glorifying God',
                    desc: 'Every aesthetic and program element points back to Him.',
                  },
                  {
                    title: '2. Highlighting His Name',
                    desc: 'Making His presence the absolute focal point of the day.',
                  },
                  {
                    title: '3. God’s Faithfulness',
                    desc: 'Space for the congregation to reflect on His provision.',
                  },
                  {
                    title: '4. Exaltation through History',
                    desc: "Acknowledging His hand in GSM's 12-year journey.",
                  },
                ].map((pillar, i) => (
                  <div key={i} className="border-l-2 border-[#C5A021] pl-6">
                    <h4 className="font-bold uppercase tracking-widest text-xs mb-2 text-[#C5A021]">
                      {pillar.title}
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-900">
                <h3 className="font-serif text-xl mb-2 italic">
                  Rebuild (Act I)
                </h3>
                <p className="text-sm text-gray-600">
                  Reflection and foundation. Stripped back acoustic opening.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-emerald-600">
                <h3 className="font-serif text-xl mb-2 italic">
                  Revive (Act II)
                </h3>
                <p className="text-sm text-gray-600">
                  Awakening and praise. Restoration Wall interactive activity.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border shadow-sm border-l-8 border-[#C5A021]">
                <h3 className="font-serif text-xl mb-2 italic">
                  Reign (Act III)
                </h3>
                <p className="text-sm text-gray-600">
                  Fellowship and leader ordination. Transition to Banquet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MAP */}
        {activeTab === 'floor' && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h3 className="font-bold text-emerald-900 uppercase text-xs tracking-widest mb-3">
                  Blueprint: Spatial Engineering v3.3
                </h3>
                <div className="flex flex-wrap gap-4">
                  {!isBanquet ? (
                    <>
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500">
                        <div className="w-3 h-3 bg-[#86efac] rounded-sm" />{' '}
                        Guest Seats
                      </div>
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500">
                        <div className="w-3 h-3 bg-[#fef08a] border border-[#854d0e] rounded-sm" />{' '}
                        Leaders
                      </div>
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500">
                        <div className="w-3 h-3 bg-[#3b82f6] rounded-full" />{' '}
                        T&O Box
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500">
                        <div className="w-3 h-3 bg-[#e67e22] rounded-sm" />{' '}
                        Tables
                      </div>
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase text-gray-500">
                        <div className="w-3 h-3 bg-[#4ade80] rounded-sm" /> Free
                        Seating
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsBanquet(!isBanquet)}
                className="bg-emerald-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
              >
                {isBanquet
                  ? 'Return to Service Seating'
                  : 'Activate Banquet Layout'}
              </button>
            </div>
            <div className="relative w-full aspect-[1.4/1] border-[6px] border-[#2D2D2D] bg-white overflow-hidden mx-auto max-w-[900px] rounded-sm">
              <div
                className="absolute border border-black z-10 flex items-center justify-center font-black text-[0.5rem] md:text-[0.65rem] uppercase bg-white/50"
                style={{
                  top: '12.5%',
                  left: '19.5%',
                  width: '53.5%',
                  height: '38.5%',
                }}
              >
                Main Hall
              </div>
              <div
                className="absolute border border-black border-l-dashed z-10 flex items-center justify-center font-black text-[0.5rem] uppercase bg-[#fffcf0] text-orange-700"
                style={{
                  top: '12.5%',
                  left: '73%',
                  width: '14%',
                  height: '38.5%',
                }}
              >
                Overflow
              </div>
              <div
                className="absolute border border-black bg-gray-100 z-10 flex items-center justify-center font-black text-[0.65rem] uppercase"
                style={{
                  top: '12.5%',
                  left: '87%',
                  width: '10%',
                  height: '38.5%',
                }}
              >
                Stage
              </div>
              {!isBanquet ? (
                <>
                  <div
                    className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50"
                    style={{ left: '44%', top: '44%' }}
                  />
                  <div
                    className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md z-50"
                    style={{ left: '75%', top: '30%' }}
                  />
                  {renderServiceDots()}
                </>
              ) : (
                renderBanquetLayout()
              )}
            </div>
          </div>
        )}

        {/* PROGRAM */}
        {activeTab === 'program' && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl animate-in">
            <div className="p-8 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="font-serif text-2xl italic">Program Flow</h3>
              <span className="text-xs font-black uppercase text-[#C5A021]">
                May 29, 2026
              </span>
            </div>
            <table className="w-full text-left">
              <tbody className="text-[0.8rem] md:text-sm divide-y divide-gray-50">
                {program.map((row, i) => (
                  <tr
                    key={i}
                    className={`${row.style} transition-colors hover:bg-gray-50/50`}
                  >
                    <td className="p-5 font-bold w-24 md:w-32 border-r">
                      {row.time}
                    </td>
                    <td className="p-5">{row.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LOGISTICS */}
        {activeTab === 'logistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-3xl text-emerald-900 mb-8 italic">
                7-Group Catering Matrix
              </h3>
              <div className="space-y-3">
                {catering.map((item, i) => (
                  <div
                    key={i}
                    className={`flex justify-between p-4 rounded-xl border ${
                      item.confirmed
                        ? 'bg-[#fffcf0] border-orange-100'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <span className="font-medium">{item.group}</span>
                    <span
                      className={`font-bold ${
                        item.confirmed
                          ? 'text-orange-800'
                          : 'text-gray-400 italic text-xs'
                      }`}
                    >
                      {item.dish}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-5 bg-emerald-900 text-white rounded-xl shadow-md mt-4 font-bold">
                  <span>Church</span>
                  <span className="italic text-emerald-200 text-xs">
                    To be confirmed
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-emerald-800">
                <h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">
                  Transport Matrix (Sis Bhing)
                </h4>
                <p className="text-sm font-medium">
                  Routes: Burhama, Sanabis, Gudabiya. Lock by May 15. Arrival by
                  1:00 PM strict.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-[#fef08a]">
                <h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">
                  Committee Contribution
                </h4>
                <p className="text-sm font-medium">
                  BD 5.000 (Committee) / BD 3.500 (Shirt - Bhim/Deon). Deadline:
                  May 15.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl border shadow-sm border-l-8 border-slate-400">
                <h4 className="font-bold text-emerald-900 uppercase text-xs mb-3 tracking-widest">
                  Stage Pledge
                </h4>
                <p className="text-sm font-medium">
                  BD 100.000 for Stage Deco (Pastor Benny). Setup: May 28.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMMITTEES */}
        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {committees.map((comm, i) => (
              <div
                key={i}
                className={`bg-white p-6 rounded-3xl border-t-8 ${comm.color} shadow-lg hover:shadow-xl transition-all`}
              >
                <h3 className="font-bold text-emerald-900 text-sm uppercase mb-1 tracking-wider">
                  {comm.title}
                </h3>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase mb-4">
                  {comm.team}
                </p>
                <div className="space-y-3">
                  {comm.tasks.map((task, j) => (
                    <div
                      key={j}
                      className="flex gap-3 items-start text-[0.7rem] leading-tight text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100"
                    >
                      <div className="w-4 h-4 border-2 border-[#C5A021] rounded bg-white flex-shrink-0 mt-0.5" />
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MIGRATION BUTTON (Click once to sync Firestore) */}
        <div className="mt-20 border-t pt-10 text-center">
          <button
            onClick={migrateToFirebase}
            className="bg-gray-100 text-gray-400 px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-emerald-900 hover:text-white transition-all shadow-sm"
          >
            Sync Website Content to Firestore
          </button>
        </div>
      </main>
    </div>
  );
}
