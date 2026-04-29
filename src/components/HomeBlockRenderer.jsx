import React, { useState, useEffect } from 'react';

const HomeBlockRenderer = ({ block, setActiveTab }) => {
	const handleLink = () => {
		if (block.linkTo) setActiveTab(block.linkTo);
	};

	const commonClasses = `${block.linkTo ? 'cursor-pointer hover:opacity-95 transition-all' : ''} mb-8 animate-in fade-in duration-700`;

	switch (block.type) {
		case 'hero':
			return (
				<div onClick={handleLink} className={`${commonClasses} relative rounded-3xl overflow-hidden shadow-2xl group`}>
					<img src={block.imageUrl} alt="Hero" className="w-full aspect-[16/9] md:aspect-[21/9] object-cover group-hover:scale-105 transition-transform duration-1000" />
					<div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent flex items-end p-8">
						<h2 className="text-white font-serif italic text-2xl md:text-5xl tracking-tight">{block.title}</h2>
					</div>
				</div>
			);
		case 'countdown':
			const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

			useEffect(() => {
				const timer = setInterval(() => {
					const target = new Date(block.content || Date.now()).getTime();
					const now = new Date().getTime();
					const gap = target - now;

					if (gap > 0) {
						setTimeLeft({
							d: Math.floor(gap / (1000 * 60 * 60 * 24)),
							h: Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
							m: Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60)),
							s: Math.floor((gap % (1000 * 60)) / 1000)
						});
					}
				}, 1000);
				return () => clearInterval(timer);
			}, [block.content]);

			return (
				<div onClick={handleLink} className={`${commonClasses} bg-emerald-900 rounded-3xl p-8 text-center text-white shadow-xl`}>
					<p className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-60">
						{block.title || 'the Event'}
					</p>
					<div className="flex justify-center gap-4 md:gap-10">
						{[['Days', timeLeft.d], ['Hrs', timeLeft.h], ['Min', timeLeft.m], ['Sec', timeLeft.s]].map(([label, val]) => (
							<div key={label} className="flex flex-col">
								<span className="font-serif italic text-3xl md:text-6xl">{String(val).padStart(2, '0')}</span>
								<span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-2">{label}</span>
							</div>
						))}
					</div>
				</div>
			);
		case 'grid':
			return (
				<div onClick={handleLink} className={`${commonClasses} grid grid-cols-3 gap-2 md:gap-6`}>
					{block.items?.map((item, i) => {
						const bgImage = item.imageUrl || item.image || item.content;
						const hasImage = bgImage && typeof bgImage === 'string' && bgImage.startsWith('http');

						return (
							<div
								key={i}
								className="relative aspect-square md:aspect-auto md:h-64 rounded-2xl border border-slate-100 transition-all overflow-hidden bg-slate-50 shadow-sm"
								style={{
									backgroundImage: hasImage ? `url(${bgImage})` : 'none',
									backgroundSize: 'cover',
									backgroundPosition: 'center'
								}}
							>
								<div className="relative z-10 w-full h-full flex flex-col justify-between items-center text-center py-3 px-1">
									<div className="w-full">
										<h4 className={`font-serif italic text-[10px] md:text-lg leading-tight ${hasImage ? 'text-white' : 'text-emerald-900'}`}>
											{item.title}
										</h4>
									</div>
									<div className="flex-1 flex items-center justify-center px-1">
										{item.desc && (
											<p className={`text-[7px] md:text-xs leading-tight line-clamp-3 ${hasImage ? 'text-slate-200' : 'text-slate-500'}`}>
												{item.desc}
											</p>
										)}
									</div>
									<div className="w-full flex justify-center pt-1">
										{item.ctaText ? (
											<button
												onClick={(e) => {
													e.stopPropagation();
													const link = item.ctaLink;

													if (link?.startsWith('program:')) {
														const eventTitle = link.split(':')[1];
														setActiveTab('program');
														setTimeout(() => {
															const elements = document.getElementsByTagName('h4');
															const target = Array.from(elements).find(el =>
																el.innerText.toLowerCase().includes(eventTitle.toLowerCase())
															);
															if (target) {
																target.scrollIntoView({ behavior: 'smooth', block: 'center' });
																target.classList.add('bg-emerald-50');
																setTimeout(() => target.classList.remove('bg-emerald-50'), 2000);
															}
														}, 300);
													} else if (['register', 'map', 'vision', 'program', 'logistics'].includes(link)) {
														setActiveTab(link);
														window.scrollTo({ top: 0, behavior: 'smooth' });
													} else if (link) {
														window.open(link, '_blank');
													}
												}}
												className={`px-3 py-1 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${hasImage
													? 'bg-transparent border-white text-white hover:bg-white hover:text-emerald-900'
													: 'bg-emerald-900 border-emerald-900 text-white hover:bg-emerald-800'
													}`}
											>
												{item.ctaText}
											</button>
										) : (
											<div className="h-[18px] md:h-[24px]" />
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			);
		case 'text':
			return (
				<div onClick={handleLink} className={`${commonClasses} max-w-3xl mx-auto text-center py-12`}>
					<h2 className="font-serif italic text-3xl text-emerald-900 mb-6">{block.title}</h2>
					<div className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-line px-4">
						{block.content}
					</div>
				</div>
			);
		case 'slideshow':
			const slides = block.slides || [];
			const [current, setCurrent] = useState(0);

			useEffect(() => {
				if (slides.length <= 1) return;
				const slideTimer = setInterval(() => {
					setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
				}, 5000);
				return () => clearInterval(slideTimer);
			}, [slides.length]);

			if (slides.length === 0) return null;

			return (
				<div className={`${commonClasses} relative group max-w-4xl mx-auto`}>
					<div
						onClick={() => slides[current]?.link && setActiveTab(slides[current].link)}
						className={`overflow-hidden rounded-3xl shadow-2xl aspect-[16/9] relative ${slides[current]?.link ? 'cursor-pointer' : ''}`}
					>
						{slides.map((slide, i) => (
							<img
								key={i}
								src={slide.url}
								className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
								alt=""
							/>
						))}
						{slides[current]?.link && (
							<div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
								Click to View
							</div>
						)}
					</div>
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full z-10">
						{slides.map((_, i) => (
							<button
								key={i}
								onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
								className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`}
							/>
						))}
					</div>
				</div>
			);
		case 'image':
			return (
				<div onClick={handleLink} className={commonClasses}>
					<img src={block.imageUrl} alt="Section" className="w-full h-auto rounded-3xl shadow-lg" />
				</div>
			);
		case 'divider':
			return <div className="w-24 h-1 bg-[#C5A021]/30 mx-auto my-16 rounded-full" />;
		default:
			return null;
	}
};
export default HomeBlockRenderer;