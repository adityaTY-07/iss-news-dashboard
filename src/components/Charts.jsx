import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Charts = ({ speedHistory }) => {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col h-[350px]">
      <h3 className="text-lg font-bold mb-4">ISS Speed Trend</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={speedHistory} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="time" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={['auto', 'auto']} width={60} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
              itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}
            />
            <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
