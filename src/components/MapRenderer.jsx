import React from 'react';

const MapRenderer = ({ mode, mapObjects, isAdminView = false }) => {
    const churchAddress = "Unit 152, 15th Floor, Bahrain Tower Building, Manama Centre, 385, Bahrain";

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            
            {/* --- 1. THE FLOOR PLAN (Your Existing Logic) --- */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-emerald-800 uppercase italic tracking-widest opacity-40">
                    {mode === 'banquet' ? 'Banquet Seating Layout' : 'Service Hall Layout'}
                </h4>
                <div className="relative w-full aspect-[1.8/1] md:aspect-[2.2/1] border-[2px] border-[#2D2D2D] bg-white overflow-hidden rounded-md mx-auto max-w-[700px] shadow-sm">
                    {mapObjects.filter(obj => mode === 'banquet' ? obj.showInBanquet : obj.showInService).map(obj => (
                        <div
                            key={obj.id}
                            onClick={() => {
                                if (isAdminView) {
                                    const element = document.getElementById(`edit-${obj.id}`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        element.classList.add('ring-2', 'ring-emerald-500');
                                        setTimeout(() => element.classList.remove('ring-2', 'ring-emerald-500'), 2000);
                                    }
                                }
                            }}
                            className={`absolute flex items-center justify-center transition-all cursor-pointer ${obj.type === 'room' ? 'border border-black bg-black/5' : obj.type === 'block' ? 'bg-emerald-500/5 border border-emerald-900/10' : obj.type === 'icon' ? 'bg-blue-500 rounded-full border border-white shadow-sm' : 'bg-orange-400 border border-orange-600 shadow-sm'}`}
                            style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%`, zIndex: 10 }}
                        >
                            {obj.label && <span className="text-black text-[5px] md:text-[8px] font-black uppercase tracking-tighter text-center leading-none px-0.5">{obj.label}</span>}
                            {obj.type === 'block' && (
                                <div className="absolute inset-0 p-1 gap-1 grid" style={{ gridTemplateColumns: `repeat(${obj.cols || 4}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${obj.rows || 6}, minmax(0, 1fr))` }}>
                                    {Array.from({ length: (obj.rows || 6) * (obj.cols || 4) }).map((_, i) => (<div key={i} className="w-0.5 h-0.5 md:w-1 md:h-1 bg-emerald-600 rounded-full opacity-40 mx-auto" />))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- 2. THE GOOGLE MAP PREVIEW (The New Addition) --- */}
            {!isAdminView && (
                <div className="space-y-6 pt-10 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-emerald-800 uppercase italic tracking-widest opacity-40">
                        Google Maps Location
                    </h4>
                    
                    <div className="w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-slate-50">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3578.767314019961!2d50.577767875594965!3d26.236749088812502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e49a5f5f90efa9b%3A0x7cbffc5f9de28db2!2sBahrain%20Tower%2C%20Al%20Khalifa%20Ave%2C%20Manama!5e0!3m2!1sen!2sbh!4v1777480158446!5m2!1sen!2sbh"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest mb-1">GSM Worship Hall</p>
                            <p className="text-slate-500 text-xs font-bold italic">{churchAddress}</p>
                        </div>
                        <a 
                            href="https://maps.app.goo.gl/fZGsuuooKwUq8tKMA" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-emerald-900 text-white px-8 py-3 rounded-full font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-emerald-800 transition-all active:scale-95 whitespace-nowrap"
                        >
                            Open Navigation
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapRenderer;