import React from 'react';

const RegistrationSection = ({ forms, activeFormId, setActiveFormId, submitResponse }) => {
	return (
		<div className="max-w-xl mx-auto animate-in fade-in pt-0">
			{/* Form Selection Tabs */}
			<div className="flex flex-wrap bg-emerald-900/5 p-1 rounded-xl gap-2 shadow-inner mb-10">
				{forms.filter(f => f.isVisible).map(f => (
					<button
						key={f.id}
						onClick={() => setActiveFormId(f.id)}
						className={`
            flex-1 min-w-[120px] py-2 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500
            ${activeFormId === f.id
								? 'bg-emerald-900 text-white shadow-md'
								: 'text-emerald-900/40 hover:text-emerald-900'}
          `}
					>
						{f.title}
					</button>
				))}
			</div>

			{activeFormId && forms.find(f => f.id === activeFormId) && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const currentForm = forms.find(f => f.id === activeFormId);
						submitResponse({
							...Object.fromEntries(new FormData(e.target).entries()),
							formTitle: currentForm.title
						});
					}}
					className="bg-white border border-slate-100 rounded-2xl p-6 md:p-10 shadow-sm space-y-6"
				>
					<h3 className="font-serif italic text-xl text-emerald-900 border-b border-slate-50 pb-3">
						{forms.find(f => f.id === activeFormId)?.title}
					</h3>

					{forms.find(f => f.id === activeFormId)?.fields?.map(field => (
						<div key={field.id} className="space-y-1.5">
							<label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">{field.label}</label>

							{field.type === 'text' && (
								<input name={field.label} required={field.required} className="w-full border-b border-slate-100 py-2 text-sm outline-none focus:border-emerald-900 transition-all bg-transparent" placeholder="Your answer" />
							)}

							{field.type === 'paragraph' && (
								<textarea name={field.label} required={field.required} className="w-full border-b border-slate-100 py-2 text-sm outline-none focus:border-emerald-900 transition-all bg-transparent h-24 resize-none" placeholder="Your answer" />
							)}

							{field.type === 'dropdown' && (
								<select name={field.label} required={field.required} className="w-full border-b border-slate-100 py-2 text-sm outline-none bg-transparent appearance-none">
									<option value="">Select Option</option>
									{field.options?.map(o => <option key={o} value={o}>{o}</option>)}
								</select>
							)}

							{(field.type === 'radio' || field.type === 'checkbox') && (
								<div className="pt-1 flex flex-wrap gap-4">
									{field.options?.map(o => (
										<label key={o} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
											<input
												type={field.type === 'radio' ? 'radio' : 'checkbox'}
												name={field.type === 'radio' ? field.label : `${field.label}[]`}
												value={o}
												className="accent-emerald-900"
											/> {o}
										</label>
									))}
								</div>
							)}
						</div>
					))}

					<button type="submit" className="w-full bg-emerald-900 text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-widest mt-6 shadow-lg active:scale-95 transition-all">
						Submit Registration
					</button>
				</form>
			)}
		</div>
	);
};

export default RegistrationSection;