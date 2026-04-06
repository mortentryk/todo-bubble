import React, { useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Sparkles,
    ChevronDown,
    ChevronRight,
    Plus,
    MessageCircle,
    Trash2,
    GripVertical,
    ChevronUp,
    ArrowUpToLine
} from "lucide-react";

function GoalCard({
    goal,
    tasks,
    isExpanded,
    onToggleExpanded,
    tinyInput,
    onTinyInputChange,
    onAddTinyStep,
    onToggleTinyTaskDone,
    onSendTinyTaskToBubble,
    onRemoveTinyTask,
    dragControls,
    goalIndex,
    goalCount,
    onMoveGoal,
    onRequestRemoveGoal
}) {
    const doneCount = tasks.filter((task) => task.done).length;
    const nextStep = tasks.find((task) => !task.done);
    const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
    const isFirst = goalIndex <= 0;
    const isLast = goalIndex >= goalCount - 1;

    const body = (
        <div className="flex gap-2 sm:gap-3">
            <div className="flex flex-col gap-1 shrink-0 self-start">
                <button
                    type="button"
                    className="touch-none rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                    aria-label="Drag to reorder goal"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripVertical size={20} aria-hidden />
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Move goal up"
                    disabled={isFirst}
                    onClick={() => onMoveGoal(goal.id, "up")}
                >
                    <ChevronUp size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Move goal down"
                    disabled={isLast}
                    onClick={() => onMoveGoal(goal.id, "down")}
                >
                    <ChevronDown size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Move goal to top"
                    disabled={isFirst}
                    onClick={() => onMoveGoal(goal.id, "top")}
                >
                    <ArrowUpToLine size={18} aria-hidden />
                </button>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onToggleExpanded(goal.id)}
                        className="min-w-0 flex-1 flex items-center justify-between gap-3 text-left group"
                        aria-expanded={isExpanded}
                    >
                        <div className="min-w-0">
                            <div className="text-slate-800 font-semibold">{goal.title}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {doneCount}/{tasks.length} tiny steps done
                            </div>
                            <div
                                className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-slate-200 overflow-hidden"
                                aria-hidden
                            >
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-[width]"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                        <span
                            className="shrink-0 inline-flex items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 p-2 text-slate-700 shadow-sm group-hover:border-slate-400 group-hover:bg-slate-200 group-hover:text-slate-900 transition-colors"
                            aria-hidden
                        >
                            {isExpanded ? (
                                <ChevronDown size={22} strokeWidth={2.5} className="block" />
                            ) : (
                                <ChevronRight size={22} strokeWidth={2.5} className="block" />
                            )}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestRemoveGoal(goal.id);
                        }}
                        className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="Delete goal"
                        title="Delete goal"
                    >
                        <Trash2 size={18} aria-hidden />
                    </button>
                </div>

                {nextStep ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 text-sm text-emerald-800 flex items-center gap-2">
                            <Sparkles size={14} />
                            <span className="truncate">Next step: {nextStep.text}</span>
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
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex flex-wrap items-center gap-2"
                                >
                                    <button
                                        type="button"
                                        onClick={() => onToggleTinyTaskDone(task.id)}
                                        className="text-slate-500 hover:text-slate-700"
                                        title={task.done ? "Mark as not done" : "Mark as done"}
                                    >
                                        {task.done ? (
                                            <CheckCircle2 size={18} className="text-emerald-600" />
                                        ) : (
                                            <Circle size={18} />
                                        )}
                                    </button>
                                    <span
                                        className={`min-w-0 flex-1 text-sm ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                                    >
                                        {task.text}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onSendTinyTaskToBubble(task.id)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                                        title="Send tiny step to bubble board"
                                    >
                                        <MessageCircle size={13} />
                                        Bubble
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTinyTask(task.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                                        title="Delete tiny step"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Sparkles size={16} className="text-sky-600" />
                                <span className="text-sm font-semibold">Add tiny step</span>
                            </div>
                            <span className="hidden sm:inline text-xs text-slate-500">2-10 minutes</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={tinyInput}
                                onChange={(e) => onTinyInputChange(goal.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") onAddTinyStep(goal.id);
                                }}
                                placeholder="e.g. 5-minute tidy"
                                className="flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <button
                                type="button"
                                onClick={() => onAddTinyStep(goal.id)}
                                disabled={!tinyInput.trim()}
                                className="rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add tiny step
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Reorder.Item
            as="div"
            value={goal.id}
            dragListener={false}
            dragControls={dragControls}
            className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"
        >
            {body}
        </Reorder.Item>
    );
}

function GoalRowWithDrag(props) {
    const dragControls = useDragControls();
    return <GoalCard {...props} dragControls={dragControls} />;
}

export default function GoalsPage({
    goals,
    tinyTasks,
    onAddGoal,
    onReorderGoals,
    onMoveGoal,
    onRemoveGoal,
    onAddTinyTask,
    onToggleTinyTaskDone,
    onSendTinyTaskToBubble,
    onRemoveTinyTask
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
        const createdGoalId = onAddGoal(goalTitle);
        if (createdGoalId) {
            setExpandedGoals((prev) => ({ ...prev, [createdGoalId]: true }));
        }
        setGoalTitle("");
    };

    const addTinyTask = (goalId) => {
        const nextTask = tinyInputs[goalId] || "";
        onAddTinyTask(goalId, nextTask);
        setExpandedGoals((prev) => ({ ...prev, [goalId]: true }));
        setTinyInputs((prev) => ({ ...prev, [goalId]: "" }));
    };

    const toggleExpanded = (goalId) => {
        setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
    };

    const setTinyInputForGoal = (goalId, value) => {
        setTinyInputs((prev) => ({ ...prev, [goalId]: value }));
    };

    const handleRemoveGoal = (goalId) => {
        if (!window.confirm("Delete this goal and all its tiny steps?")) return;
        onRemoveGoal(goalId);
        setExpandedGoals((prev) => {
            const next = { ...prev };
            delete next[goalId];
            return next;
        });
        setTinyInputs((prev) => {
            const next = { ...prev };
            delete next[goalId];
            return next;
        });
    };

    const sharedCardProps = (goal, goalIndex) => ({
        goal,
        tasks: tasksByGoal[goal.id] || [],
        isExpanded: !!expandedGoals[goal.id],
        onToggleExpanded: toggleExpanded,
        tinyInput: tinyInputs[goal.id] || "",
        onTinyInputChange: setTinyInputForGoal,
        onAddTinyStep: addTinyTask,
        onToggleTinyTaskDone,
        onSendTinyTaskToBubble,
        onRemoveTinyTask,
        goalIndex,
        goalCount: goals.length,
        onMoveGoal,
        onRequestRemoveGoal: handleRemoveGoal
    });

    const listSection =
        goals.length === 0 ? (
            <div className="h-[36vh] flex items-center justify-center text-center text-slate-400 px-6">
                Start with one simple goal and one tiny step.
            </div>
        ) : (
            <Reorder.Group
                axis="y"
                as="div"
                values={goals.map((g) => g.id)}
                onReorder={onReorderGoals}
                className="flex flex-col gap-3"
            >
                {goals.map((goal, index) => (
                    <GoalRowWithDrag key={goal.id} {...sharedCardProps(goal, index)} />
                ))}
            </Reorder.Group>
        );

    return (
        <div className="min-h-[62vh] sm:min-h-[70vh] rounded-3xl bg-white/80 p-4 sm:p-5 shadow-lg border border-slate-200">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-800">Goals</h2>
                <p className="text-sm text-slate-500">Drag the handle or use arrows to reorder.</p>
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
                        type="button"
                        onClick={addGoal}
                        disabled={!goalTitle.trim()}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-40"
                    >
                        Add goal
                    </button>
                </div>
            </div>

            {listSection}
        </div>
    );
}
