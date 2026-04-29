import React from 'react';

const MapRenderer = ({ mode, mapObjects, isAdminView = false }) => (
	<div className="relative w-full aspect-[1.8/1] md:aspect-[2.2/1] border-[2px] border-[#2D2D2D] bg-white overflow-hidden rounded-md mx-auto max-w-[700px]">
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
);

export default MapRenderer;