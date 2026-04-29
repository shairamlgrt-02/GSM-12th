import React from 'react';

const VisionSection = ({ siteContent, visionActs }) => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-in duration-500">
			<div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden h-fit">
				<div className="bg-emerald-900 p-4">
					<h2 className="text-lg md:text-xl font-serif text-white italic tracking-tight leading-none">The 4 Spiritual Pillars</h2>
				</div>
				<div className="divide-y divide-slate-50">
					{[1, 2, 3, 4].map(n => (
						<div key={n} className="p-4 hover:bg-slate-50 transition-all">
							<h4 className="font-bold uppercase text-[12px] text-emerald-900 mb-1 tracking-widest opacity-40 italic">
								{siteContent?.[`pillar${n}Title`] || `Pillar ${n}`}
							</h4>
							<p className="text-slate-600 text-[11px] md:text-sm leading-relaxed font-medium tracking-tight">
								{siteContent?.[`pillar${n}Desc`]}
							</p>
						</div>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-3">
				{visionActs.map(act => (
					<div key={act.id} className="bg-white p-5 md:p-6 rounded-xl border border-slate-100 border-l-[6px] border-emerald-900 shadow-sm">
						<h3 className="font-serif text-[12px] italic text-emerald-900 tracking-tight mb-0.5">{act.title}</h3>
						<p className="text-[8px] md:text-sm text-gray-500 leading-relaxed font-medium tracking-tight whitespace-pre-line">{act.desc}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default VisionSection;