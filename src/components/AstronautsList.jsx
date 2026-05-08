import React from 'react';
import { Users } from 'lucide-react';

const AstronautsList = ({ astronauts }) => {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col h-[200px]">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">People in Space: {astronauts.number}</h3>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        {astronauts.people && astronauts.people.length > 0 ? (
          <ul className="space-y-2">
            {astronauts.people.map((person, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-lg">
                <span className="font-medium">{person.name}</span>
                <span className="text-xs text-muted-foreground uppercase">{person.craft}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Loading astronauts...</p>
        )}
      </div>
    </div>
  );
};

export default AstronautsList;
