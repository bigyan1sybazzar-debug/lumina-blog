import React, { useRef, useEffect } from 'react';
import { Bot, Play, Pause, Zap, Clock, CheckCircle, Terminal } from 'lucide-react';
import { Category } from '../../types';

interface AutoLog {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface AutomationPanelProps {
    isAutoPilotOn: boolean;
    toggleAutoPilot: () => void;
    runAutomationCycle: () => Promise<void>;
    autoLogs: AutoLog[];
    setAutoLogs: React.Dispatch<React.SetStateAction<AutoLog[]>>;
    categories: Category[];
}

export const AutomationPanel: React.FC<AutomationPanelProps> = ({
    isAutoPilotOn,
    toggleAutoPilot,
    runAutomationCycle,
    autoLogs,
    setAutoLogs,
    categories
}) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [autoLogs]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bot size={28} className="text-primary-600" />
                        Auto-Pilot Automation
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Automatically fetch news, generate articles, create images, and publish 4 times a day.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm">
                        <span className="text-gray-500 mr-2">Status:</span>
                        <span className={`font-bold ${isAutoPilotOn ? 'text-green-500' : 'text-gray-500'}`}>
                            {isAutoPilotOn ? 'Active (Server)' : 'Inactive'}
                        </span>
                    </div>

                    <button
                        onClick={toggleAutoPilot}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm ${isAutoPilotOn
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/20'
                            }`}
                    >
                        {isAutoPilotOn ? <Pause size={18} /> : <Play size={18} />}
                        {isAutoPilotOn ? 'Stop Auto-Pilot' : 'Start Auto-Pilot'}
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                    <div className={`absolute top-0 right-0 p-4 opacity-10 ${isAutoPilotOn ? 'text-green-500' : 'text-gray-400'}`}>
                        <Zap size={64} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`w-3 h-3 rounded-full ${isAutoPilotOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isAutoPilotOn ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {isAutoPilotOn ? 'Scheduled to run once/day' : 'Click start to begin'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Scheduled Run</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <Clock size={24} className="text-blue-500" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Every 24 Hours
                        </span>
                    </div>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Server-side automation active
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Categories</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {categories.slice(0, 5).map(c => (
                            <span key={c.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                                {c.name}
                            </span>
                        ))}
                        {categories.length > 5 && (
                            <span className="text-xs text-gray-400 self-center">+{categories.length - 5} more</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Console Log Area */}
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col h-[400px]">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-gray-400" />
                        <span className="text-sm font-mono text-gray-300">Automation Logs</span>
                    </div>
                    <button
                        onClick={() => setAutoLogs([])}
                        className="text-xs text-gray-400 hover:text-white hover:underline"
                    >
                        Clear Logs
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-2">
                    {autoLogs.length === 0 && (
                        <div className="text-gray-600 italic text-center mt-10">No activity logs yet...</div>
                    )}
                    {autoLogs.map((log) => (
                        <div key={log.id} className="flex gap-3">
                            <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                            <span className={`break-all ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                        'text-blue-300'
                                }`}>
                                {log.type === 'success' && '✓ '}
                                {log.type === 'error' && '✕ '}
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Manual Trigger for Testing */}
            <div className="flex justify-end">
                <button
                    onClick={runAutomationCycle}
                    disabled={isAutoPilotOn}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                    Trigger Single Run (Test)
                </button>
            </div>
        </div>
    );
};
