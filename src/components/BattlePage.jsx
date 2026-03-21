import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AvatarCard from "./AvatarCard";
import { randomPastel } from "../utils/helpers";

const MOVES = [
    { id: "rock", label: "Rock", emoji: "🪨" },
    { id: "paper", label: "Paper", emoji: "📄" },
    { id: "scissors", label: "Scissors", emoji: "✂️" }
];

const beats = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper"
};

function getMove(moveId) {
    return MOVES.find((m) => m.id === moveId) || null;
}

function rpsWinner(move1, move2) {
    if (!move1 || !move2) return null;
    if (move1 === move2) return null;
    // Returns "p1" if move1 beats move2, otherwise "p2"
    return beats[move1] === move2 ? "p1" : "p2";
}

export default function BattlePage({
    users = [],
    activeUser = "",
    avatarProfiles = {},
    getProgress,
    getAvatarName,
    onApplyBattleResult
}) {
    const [player1, setPlayer1] = useState(activeUser || users[0] || "");
    const [player2, setPlayer2] = useState(() => {
        const fallback1 = activeUser || users[0] || "";
        const other = users.find((u) => u !== fallback1) || "";
        return other;
    });

    const [moves1, setMoves1] = useState([null, null, null]);
    const [moves2, setMoves2] = useState([null, null, null]);
    const [phase, setPhase] = useState("picking"); // picking | fighting | result
    const [roundIndex, setRoundIndex] = useState(0);
    const [roundStage, setRoundStage] = useState("ready"); // ready | clash | show
    const [roundOutcome, setRoundOutcome] = useState(null); // { winner:'p1'|'p2'|null, isDraw:boolean, text:string }
    const [matchResult, setMatchResult] = useState(null); // { winner:'p1'|'p2'|null, p1Wins:number, p2Wins:number, isDraw:boolean, text:string }
    const [preparedMatch, setPreparedMatch] = useState(null);
    const [showWinnerVideoModal, setShowWinnerVideoModal] = useState(false);
    const [videoFallbackIndex, setVideoFallbackIndex] = useState(0);

    const fightTimeoutRef = useRef([]);

    const profile1 = avatarProfiles[player1] || null;
    const profile2 = avatarProfiles[player2] || null;

    const xp1 = profile1?.xp ?? 0;
    const xp2 = profile2?.xp ?? 0;

    const canResolve =
        !!player1 &&
        !!player2 &&
        moves1.every(Boolean) &&
        moves2.every(Boolean) &&
        phase === "picking";

    const otherUsersFor = (pickedUser) => users.filter((u) => u !== pickedUser);

    useEffect(() => {
        setPlayer1(activeUser || users[0] || "");
        const other = users.find((u) => u !== (activeUser || users[0] || "")) || "";
        setPlayer2(other);
        setMoves1([null, null, null]);
        setMoves2([null, null, null]);
        setPhase("picking");
        setRoundIndex(0);
        setRoundStage("ready");
        setRoundOutcome(null);
        setMatchResult(null);
        setPreparedMatch(null);
        setShowWinnerVideoModal(false);
        matchKeyRef.current = null;
    }, [activeUser, users]);

    useEffect(() => {
        return () => {
            if (fightTimeoutRef.current?.length) {
                fightTimeoutRef.current.forEach((t) => window.clearTimeout(t));
            }
        };
    }, []);

    const matchKeyRef = useRef(null);

    const roundDurations = useMemo(() => ({ clashMs: 900 }), []);

    const getRoundVideoSources = (winnerSide) => {
        if (winnerSide === "p1") {
            return ["/Videos/godzillewins.mp4", "/Videos/Godzilla_Wins_Video_Generated.mp4"];
        }
        if (winnerSide === "p2") {
            return ["/Videos/King_Kong_Wins_Video_Generated.mp4"];
        }
        return [];
    };

    const resolveRound = (m1, m2, roundIdx) => {
        if (!m1 || !m2) return null;

        const roundNumber = roundIdx + 1;
        const moveLabel1 = getMove(m1)?.label || "Unknown";
        const moveLabel2 = getMove(m2)?.label || "Unknown";

        // Different picks: normal RPS
        if (m1 !== m2) {
            const winnerSide = rpsWinner(m1, m2); // "p1" | "p2" | null
            if (!winnerSide) {
                return {
                    winner: null,
                    pointAwarded: false,
                    text: `Round ${roundNumber} draw!`,
                    moveLabel1,
                    moveLabel2
                };
            }
            const winnerName = winnerSide === "p1" ? player1 : player2;
            return {
                winner: winnerSide,
                pointAwarded: true,
                text: `${winnerName} wins round ${roundNumber}!`,
                moveLabel1,
                moveLabel2
            };
        }

        // Same pick: higher XP wins; equal XP => round draw (no points)
        if (xp1 === xp2) {
            return {
                winner: null,
                pointAwarded: false,
                text: `Round ${roundNumber} draw!`,
                moveLabel1,
                moveLabel2
            };
        }

        const p1Higher = xp1 > xp2;
        const winnerSide = p1Higher ? "p1" : "p2";
        const winnerName = winnerSide === "p1" ? player1 : player2;
        return {
            winner: winnerSide,
            pointAwarded: true,
            text: `${winnerName} wins round ${roundNumber}!`,
            moveLabel1,
            moveLabel2
        };
    };

    useEffect(() => {
        if (phase !== "picking") return;
        if (!canResolve) return;

        const currentMatchKey = JSON.stringify({
            player1,
            player2,
            xp1,
            xp2,
            moves1,
            moves2
        });

        if (matchKeyRef.current === currentMatchKey) return;
        matchKeyRef.current = currentMatchKey;

        const rounds = [0, 1, 2].map((i) => resolveRound(moves1[i], moves2[i], i));
        const p1Wins = rounds.filter((r) => r?.pointAwarded && r.winner === "p1").length;
        const p2Wins = rounds.filter((r) => r?.pointAwarded && r.winner === "p2").length;

        const matchWinnerSide = p1Wins > p2Wins ? "p1" : p2Wins > p1Wins ? "p2" : null;

        setPhase("fighting");
        setRoundIndex(0);
        setRoundStage("ready");
        setRoundOutcome(null);
        setMatchResult(null);
        setPreparedMatch({ rounds, p1Wins, p2Wins, matchWinnerSide });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        phase,
        canResolve,
        player1,
        player2,
        xp1,
        xp2,
        moves1,
        moves2,
        onApplyBattleResult,
        roundDurations
    ]);

    // Final phase: user can reset moves for a rematch
    const playAgain = () => {
        if (fightTimeoutRef.current?.length) fightTimeoutRef.current.forEach((t) => window.clearTimeout(t));
        fightTimeoutRef.current = [];

        matchKeyRef.current = null;
        setMoves1([null, null, null]);
        setMoves2([null, null, null]);
        setPhase("picking");
        setRoundIndex(0);
        setRoundStage("ready");
        setRoundOutcome(null);
        setMatchResult(null);
        setPreparedMatch(null);
        setShowWinnerVideoModal(false);
    };

    const pickMove = (slotIndex, moveId, who) => {
        if (phase !== "picking") return;
        if (!moveId) return;
        if (who === "p1") {
            if (moves1[slotIndex]) return; // hide/lock once chosen
            setMoves1((prev) => prev.map((m, i) => (i === slotIndex ? moveId : m)));
            return;
        }
        if (moves2[slotIndex]) return; // hide/lock once chosen
        setMoves2((prev) => prev.map((m, i) => (i === slotIndex ? moveId : m)));
    };

    const finishMatch = () => {
        if (!preparedMatch) return;

        const { p1Wins, p2Wins, matchWinnerSide } = preparedMatch;
        const isMatchDraw = matchWinnerSide === null;
        const matchWinnerName = matchWinnerSide === "p1" ? player1 : matchWinnerSide === "p2" ? player2 : null;
        const matchLoserName = matchWinnerSide === "p1" ? player2 : matchWinnerSide === "p2" ? player1 : null;

        if (!isMatchDraw) {
            onApplyBattleResult({
                player1,
                player2,
                winner: matchWinnerName,
                loser: matchLoserName,
                isDraw: false
            });
        } else {
            onApplyBattleResult({
                player1,
                player2,
                winner: null,
                loser: null,
                isDraw: true
            });
        }

        setMatchResult({
            winner: matchWinnerSide,
            isDraw: isMatchDraw,
            p1Wins,
            p2Wins,
            text: isMatchDraw ? "Match draw!" : `${matchWinnerName} wins the match!`
        });
        setVideoFallbackIndex(0);
        setShowWinnerVideoModal(!isMatchDraw);
        setPhase("result");
    };

    const startCurrentRound = () => {
        if (!preparedMatch) return;
        if (phase !== "fighting") return;
        if (roundStage !== "ready") return;

        const round = preparedMatch.rounds[roundIndex];
        setRoundStage("clash");
        setRoundOutcome(null);

        if (fightTimeoutRef.current?.length) {
            fightTimeoutRef.current.forEach((t) => window.clearTimeout(t));
        }
        fightTimeoutRef.current = [];

        const t = window.setTimeout(() => {
            setRoundOutcome(round);
            setRoundStage("show");
            setVideoFallbackIndex(0);
        }, roundDurations.clashMs);
        fightTimeoutRef.current.push(t);
    };

    const goToNextRoundOrFinish = () => {
        if (!preparedMatch) return;
        if (roundIndex < 2) {
            setRoundIndex((prev) => prev + 1);
            setRoundStage("ready");
            setRoundOutcome(null);
            return;
        }
        finishMatch();
    };

    const p1Card = (
        <div className="w-full">
            <AvatarCard
                activeUser={player1}
                profile={avatarProfiles[player1]}
                getAvatarName={getAvatarName}
                getProgress={getProgress}
            />
        </div>
    );

    const p2Card = (
        <div className="w-full">
            <AvatarCard
                activeUser={player2}
                profile={avatarProfiles[player2]}
                getAvatarName={getAvatarName}
                getProgress={getProgress}
            />
        </div>
    );

    const impactGlow = useMemo(() => randomPastel(), []);

    return (
        <div className="min-h-[62vh] sm:min-h-[70vh] rounded-3xl bg-white/80 p-4 sm:p-5 shadow-lg border border-slate-200">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Avatar Battle</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Best of 3: pick 3 Rock/Paper/Scissors moves each. Chosen moves are Hidden; if moves match, higher XP wins the round.
                    </p>
                </div>
                <div className="text-xs text-slate-400 lg:text-right">
                    Win: <span className="font-semibold text-emerald-700">+10</span> XP, Loss:{" "}
                    <span className="font-semibold text-rose-700">-5</span> XP
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-700">Player 1</div>
                        <select
                            value={player1}
                            onChange={(e) => {
                                const next = e.target.value;
                                setPlayer1(next);
                                if (next && next === player2) {
                                    const other = otherUsersFor(next)[0] || "";
                                    setPlayer2(other);
                                }
                                playAgain();
                            }}
                            className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:w-auto"
                            aria-label="Select Player 1"
                        >
                            {users.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                    {p1Card}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-700">Player 2</div>
                        <select
                            value={player2}
                            onChange={(e) => {
                                const next = e.target.value;
                                setPlayer2(next);
                                if (next && next === player1) {
                                    const other = otherUsersFor(next)[0] || "";
                                    setPlayer1(other);
                                }
                                playAgain();
                            }}
                            className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:w-auto"
                            aria-label="Select Player 2"
                        >
                            {users
                                .filter((u) => u !== player1)
                                .map((u) => (
                                    <option key={u} value={u}>
                                        {u}
                                    </option>
                                ))}
                        </select>
                    </div>
                    {p2Card}
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                {phase === "picking" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 lg:col-span-1">
                            <div className="text-sm font-semibold text-slate-700 mb-2">Player 1 moves</div>
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                    <div className="text-xs text-slate-500 mb-2">Round {idx + 1}</div>
                                    {moves1[idx] ? (
                                        <button
                                            disabled
                                            className="w-full rounded-xl bg-slate-900 text-white/90 px-3 py-2 text-sm font-semibold opacity-70 cursor-not-allowed"
                                            aria-label={`Player 1 move ${idx + 1} locked`}
                                        >
                                            Hidden
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {MOVES.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => pickMove(idx, m.id, "p1")}
                                                    className="rounded-xl border border-slate-200 bg-white/80 hover:bg-white px-2 py-2 text-sm font-medium transition-colors"
                                                    aria-label={`Player 1 selects ${m.label} (round ${idx + 1})`}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>{m.emoji}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-slate-50 p-3 lg:col-span-1 flex items-center">
                            <div className="text-center w-full">
                                <div className="text-xs uppercase tracking-wider text-slate-500">Best of 3</div>
                                <div className="mt-2 text-sm text-slate-700">
                                    {moves1.every(Boolean) && moves2.every(Boolean)
                                        ? "All moves locked. Battle starts!"
                                        : "Pick 3 moves each. Chosen moves stay Hidden."}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 lg:col-span-1">
                            <div className="text-sm font-semibold text-slate-700 mb-2">Player 2 moves</div>
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                    <div className="text-xs text-slate-500 mb-2">Round {idx + 1}</div>
                                    {moves2[idx] ? (
                                        <button
                                            disabled
                                            className="w-full rounded-xl bg-slate-900 text-white/90 px-3 py-2 text-sm font-semibold opacity-70 cursor-not-allowed"
                                            aria-label={`Player 2 move ${idx + 1} locked`}
                                        >
                                            Hidden
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {MOVES.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => pickMove(idx, m.id, "p2")}
                                                    className="rounded-xl border border-slate-200 bg-white/80 hover:bg-white px-2 py-2 text-sm font-medium transition-colors"
                                                    aria-label={`Player 2 selects ${m.label} (round ${idx + 1})`}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>{m.emoji}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: phase === "fighting" ? 1 : 0,
                                    transition: { duration: 0.2 }
                                }}
                                style={{
                                    background: `radial-gradient(circle at 50% 50%, ${impactGlow}33, transparent 60%)`
                                }}
                                className="w-full h-full"
                            />
                        </div>

                        <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="w-full lg:flex-1">
                                <AnimatePresence>
                                    <motion.div
                                        key="p1-avatar"
                                        initial={{ x: 0 }}
                                        animate={
                                            phase === "fighting" && roundStage === "clash"
                                                ? { x: 120, scale: [1, 1.08, 1] }
                                                : { x: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.6 }}
                                        className="w-full"
                                    >
                                        {p1Card}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="w-full text-center lg:flex-[0.4]">
                                <div className="text-xs text-slate-500 uppercase tracking-wider">
                                    Battle
                                </div>

                                <AnimatePresence mode="wait">
                                    {phase === "fighting" && (
                                        <motion.div
                                            key="fighting-round"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="mt-2"
                                        >
                                            <div className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
                                                Round {roundIndex + 1}
                                            </div>

                                            {roundStage === "show" && roundOutcome?.text ? (
                                                <>
                                                    <div className="mt-2 text-sm font-bold text-slate-900">{roundOutcome.text}</div>
                                                    <div className="mt-1 text-xs text-slate-600">
                                                        {player1} chose {roundOutcome.moveLabel1}
                                                    </div>
                                                    <div className="text-xs text-slate-600">
                                                        {player2} chose {roundOutcome.moveLabel2}
                                                    </div>
                                                    <button
                                                        onClick={goToNextRoundOrFinish}
                                                        className="mt-2 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-transform"
                                                    >
                                                        {roundIndex < 2 ? `Start round ${roundIndex + 2}` : "Show winner"}
                                                    </button>
                                                </>
                                            ) : roundStage === "ready" ? (
                                                <button
                                                    onClick={startCurrentRound}
                                                    className="mt-2 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-transform"
                                                >
                                                    Start round {roundIndex + 1}
                                                </button>
                                            ) : (
                                                <div className="mt-2 text-sm font-semibold text-slate-600">Clash!</div>
                                            )}
                                        </motion.div>
                                    )}

                                    {phase === "result" && matchResult && (
                                        <motion.div
                                            key="match-result"
                                            initial={{ opacity: 0, scale: 0.9, y: 6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="mt-2"
                                        >
                                            <div className="text-sm font-bold text-slate-900">{matchResult.text}</div>
                                            {!matchResult.isDraw && (
                                                <div className="mt-1 text-xs font-semibold text-emerald-700">
                                                    Winner: {matchResult.winner === "p1" ? player1 : player2}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="w-full lg:flex-1">
                                <AnimatePresence>
                                    <motion.div
                                        key="p2-avatar"
                                        initial={{ x: 0 }}
                                        animate={
                                            phase === "fighting" && roundStage === "clash"
                                                ? { x: -120, scale: [1, 1.08, 1] }
                                                : { x: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.6 }}
                                        className="w-full"
                                    >
                                        {p2Card}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {phase === "result" && matchResult && (
                            <div className="px-4 pb-4 sm:px-6">
                                <div className="flex items-center justify-center gap-2">
                                    {!matchResult.isDraw && (
                                        <button
                                            onClick={() => setShowWinnerVideoModal(true)}
                                            className="rounded-xl bg-sky-700 text-white px-4 py-2 text-sm font-semibold hover:bg-sky-800 active:scale-95 transition-transform"
                                        >
                                            Show winner video
                                        </button>
                                    )}
                                    <button
                                        onClick={playAgain}
                                        className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-transform"
                                    >
                                        Play again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showWinnerVideoModal && phase === "result" && matchResult && !matchResult.isDraw && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowWinnerVideoModal(false)}
                >
                    <div
                        className="w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
                            <div className="text-sm font-semibold text-white">
                                Winner video - {matchResult.winner === "p1" ? player1 : player2}
                            </div>
                            <button
                                onClick={() => setShowWinnerVideoModal(false)}
                                className="rounded-lg bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                        <video
                            key={`winner-${matchResult.winner}-${videoFallbackIndex}`}
                            src={getRoundVideoSources(matchResult.winner)[videoFallbackIndex]}
                            autoPlay
                            muted
                            playsInline
                            controls
                            className="w-full max-h-[78vh] object-contain bg-black"
                            onError={() => {
                                const sources = getRoundVideoSources(matchResult.winner);
                                if (videoFallbackIndex < sources.length - 1) {
                                    setVideoFallbackIndex((prev) => prev + 1);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

