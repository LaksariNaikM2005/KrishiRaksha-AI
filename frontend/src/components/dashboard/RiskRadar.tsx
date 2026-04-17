"use client";
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RiskRadarProps {
  data: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  title?: string;
  subtitle?: string;
}

export default function RiskRadar({ data, title, subtitle }: RiskRadarProps) {
  return (
    <div className="card h-full flex flex-col">
      {title && (
        <div className="mb-4">
          <h3 className="font-bold text-primary-700">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      )}
      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#E8F5EE" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#6B7F75", fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Risk Level"
              dataKey="A"
              stroke="#2D6A4F"
              strokeWidth={2}
              fill="#52B788"
              fillOpacity={0.5}
              animationDuration={1500}
            />
            <Tooltip
              content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-xl border border-green-50">
                      <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                        {payload[0].payload.subject}
                      </p>
                      <p className="text-xl font-extrabold text-primary-600">
                        {payload[0].value}%
                      </p>
                      <p className="text-[10px] text-gray-400">Risk Severity</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Center overlay icon/value */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-black text-primary-800">
              {Math.round(data.reduce((acc, curr) => acc + curr.A, 0) / data.length)}
            </p>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Avg Risk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
