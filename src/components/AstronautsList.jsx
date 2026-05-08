import React from 'react';
import { Users } from 'lucide-react';

const AstronautsList = ({ astronauts }) => {
  return (
    <div className="bg-[#0f172a] text-slate-50 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col flex-1 min-h-[250px]">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold">People in Space: {astronauts.number}</h3>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        {astronauts.people && astronauts.people.length > 0 ? (
          <ul className="space-y-2">
            {astronauts.people.map((person, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm p-3 bg-[#1e293b] rounded-lg border border-slate-700/50">
                <span className="font-semibold text-slate-200">{person.name}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">{person.craft}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Loading astronauts...</p>
        )}
      </div>
    </div>
  );
};

export default AstronautsList;
