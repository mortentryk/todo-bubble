import React, { useMemo, useState } from "react";
import { CheckCircle2, Circle, Send, Sparkles, ChevronDown, ChevronRight } from "lucide-react";

export default function GoalsPage({
    goals,
    tinyTasks,
    onAddGoal,
    onAddTinyTask,
    onToggleTinyTaskDone,
    onSendTinyTaskToBubble
}) {
    const [goalTitle, setGoalTitle] = useState("");
    const [expandedGoals, setExpandedGoals] = useState({});
    const [tinyInputs, setTinyInputs] = useState({});

    const tasksByGoal = useMemo(() => {
        return tinyTasks.reduce((acc, task) => {
            if (!acc[task.goalId]) acc[task.goalId] = [];
            acc[task.goalId].push(task);
            return acc;
        }, {});
    }, [tinyTasks]);

    const addGoal = () => {
        onAddGoal(goalTitle);
        setGoalTitle("");
    };

    const addTinyTask = (goalId) => {
        const nextTask = tinyInputs[goalId] || "";
        onAddTinyTask(goalId, nextTask);
        setTinyInputs((prev) => ({ ...prev, [goalId]: "" }));
    };

    const toggleExpanded = (goalId) => {
        setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
    };

    return (
        <div className="min-h-[62vh] sm:min-h-[70vh] rounded-3xl bg-white/80 p-4 sm:p-5 shadow-lg border border-slate-200">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-800">Goals</h2>
                <p className="text-sm text-slate-500">Add one goal, then break it into tiny steps.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 mb-5">
                <label className="text-sm font-medium text-slate-600 block mb-2">New goal</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addGoal();
                        }}
                        placeholder="Example: Renovate kitchen"
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={addGoal}
                        disabled={!goalTitle.trim()}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-40"
                    >
                        Add goal
                    </button>
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="h-[36vh] flex items-center justify-center text-center text-slate-400 px-6">
                    Start with one simple goal and one tiny step.
                </div>
            ) : (
                <div className="space-y-3">
                    {goals.map((goal) => {
                        const tasks = tasksByGoal[goal.id] || [];
                        const doneCount = tasks.filter((task) => task.done).length;
                        const nextStep = tasks.find((task) => !task.done);
                        const isExpanded = !!expandedGoals[goal.id];

                        return (
                            <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                                <button
                                    onClick={() => toggleExpanded(goal.id)}
                                    className="w-full flex items-center justify-between gap-3 text-left"
                                >
                                    <div>
                                        <div className="text-slate-800 font-semibold">{goal.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {doneCount}/{tasks.length} tiny steps done
                                        </div>
                                    </div>
                                    <div className="text-slate-400">
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                </button>

                                {nextStep ? (
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between gap-3">
                                        <div className="text-sm text-emerald-800 flex items-center gap-2">
                                            <Sparkles size={14} />
                                            Next step: {nextStep.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                        Add a tiny step to move this goal forward.
                                    </div>
                                )}

                                <div className="mt-3">
                                    {isExpanded && tasks.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            {tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2"
                                                >
                                                    <button
                                                        onClick={() => onToggleTinyTaskDone(task.id)}
                                                        className="text-slate-500 hover:text-slate-700"
                                                        title={task.done ? "Mark as not done" : "Mark as done"}
                                                    >
                                                        {task.done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} />}
                                                    </button>
                                                    <span className={`flex-1 text-sm ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                                        {task.text}
                                                    </span>
                                                    <button
                                                        onClick={() => onSendTinyTaskToBubble(task.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                                        title="Send to bubble board"
                                                    >
                                                        <Send size={13} />
                                                        Send
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={tinyInputs[goal.id] || ""}
                                            onChange={(e) =>
                                                setTinyInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") addTinyTask(goal.id);
                                            }}
                                            placeholder="Add tiny step (2-10 minutes)"
                                            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                        <button
                                            onClick={() => addTinyTask(goal.id)}
                                            disabled={!(tinyInputs[goal.id] || "").trim()}
                                            className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-40"
                                        >
                                            Add step
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
