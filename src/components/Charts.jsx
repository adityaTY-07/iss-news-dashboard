import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const Charts = ({ speedHistory, news }) => {
  // Aggregate news by source
  const newsDist = useMemo(() => {
    if (!news || news.length === 0) return [];
    const dist = {};
    news.forEach(item => {
      const source = item.source?.name || 'Unknown';
      dist[source] = (dist[source] || 0) + 1;
    });
    return Object.keys(dist).map(key => ({ name: key, value: dist[key] }));
  }, [news]);

  return (
    <>
      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4">ISS Speed (km/h)</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedHistory}>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} width={60} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
              />
              <Line type="monotone" dataKey="speed" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-4">News by Source</h3>
        <div className="flex-1 min-h-0">
          {newsDist.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={newsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {newsDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No news data available
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Charts;
