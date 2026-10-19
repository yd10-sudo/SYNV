import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Dices,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  List,
  Hash,
  History,
  Shuffle,
  Trophy,
  Copy,
  Check,
  CheckCheck,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { soundEffects } from './utils/sound';
import { PRESETS, DrawMode, HistoryItem } from './types';

export default function App() {
  const [mode, setMode] = useState<DrawMode>('list');

  // List mode state
  const [listText, setListText] = useState<string>(
    '짜장면\n김치찌개\n돈까스\n삼겹살\n초밥\n햄버거\n마라탕\n치킨'
  );
  const [singleItemInput, setSingleItemInput] = useState<string>('');

  // Number mode state
  const [startNum, setStartNum] = useState<number>(1);
  const [endNum, setEndNum] = useState<number>(30);

  // Settings
  const [pickCount, setPickCount] = useState<number>(1);
  const [excludePicked, setExcludePicked] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [fastMode, setFastMode] = useState<boolean>(false);

  // Excluded items from non-replacement draw
  const [excludedList, setExcludedList] = useState<string[]>([]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [rollingDisplay, setRollingDisplay] = useState<string>('?');
  const [currentWinners, setCurrentWinners] = useState<string[] | null>(null);

  // History & UX
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update sound controller
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Parse items from list mode text
  const rawItems = listText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Pool of available items
  const availableItems =
    mode === 'list'
      ? rawItems.filter((item) => !excludedList.includes(item))
      : Array.from(
          { length: Math.max(0, endNum - startNum + 1) },
          (_, i) => (startNum + i).toString()
        ).filter((item) => !excludedList.includes(item));

  // Ensure pickCount is valid
  useEffect(() => {
    if (availableItems.length > 0 && pickCount > availableItems.length) {
      setPickCount(Math.max(1, availableItems.length));
    }
  }, [availableItems.length, pickCount]);

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setListText(preset.items.join('\n'));
      setExcludedList([]);
      setCurrentWinners(null);
    }
  };

  // Add individual item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = singleItemInput.trim();
    if (!trimmed) return;
    const current = listText.trim();
    setListText(current ? `${current}\n${trimmed}` : trimmed);
    setSingleItemInput('');
  };

  // Remove individual item
  const handleRemoveItem = (itemToRemove: string) => {
    const updated = rawItems.filter((item) => item !== itemToRemove);
    setListText(updated.join('\n'));
    setExcludedList((prev) => prev.filter((i) => i !== itemToRemove));
  };

  // Shuffle the current list
  const handleShuffleList = () => {
    const shuffled = [...rawItems].sort(() => Math.random() - 0.5);
    setListText(shuffled.join('\n'));
  };

  // Reset excluded items
  const handleResetExcluded = () => {
    setExcludedList([]);
  };

  // Clear all items
  const handleClearAll = () => {
    setListText('');
    setExcludedList([]);
    setCurrentWinners(null);
  };

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 200);
    } catch {
      // Ignore if canvas isn't supported
    }
  };

  // Perform draw
  const handleStartDraw = () => {
    if (availableItems.length === 0) {
      return;
    }
    if (isDrawing) return;

    setIsDrawing(true);
    setCurrentWinners(null);

    // Number of winners to pick
    const count = Math.min(pickCount, availableItems.length);

    // Shuffle pool
    const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, count);

    const duration = fastMode ? 600 : 2200;
    const intervalTime = 70;
    const startTime = Date.now();

    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
    }

    rollIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const randomIdx = Math.floor(Math.random() * availableItems.length);
      setRollingDisplay(availableItems[randomIdx]);
      soundEffects.playTick();

      if (elapsed >= duration) {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
        }
        finishDraw(winners);
      }
    }, intervalTime);
  };

  const finishDraw = (winners: string[]) => {
    setIsDrawing(false);
    setCurrentWinners(winners);
    setRollingDisplay(winners[0] || '');

    // Play fanfare & confetti
    soundEffects.playFanfare();
    triggerConfetti();

    // If excludePicked is enabled, record to excludedList
    if (excludePicked) {
      setExcludedList((prev) => [...prev, ...winners]);
    }

    // Add to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      mode,
      results: winners,
      poolSize: availableItems.length,
    };
    setHistory((prev) => [historyItem, ...prev].slice(0, 30));
  };

  // Copy result to clipboard
  const handleCopyResult = () => {
    if (!currentWinners) return;
    const text =
      currentWinners.length === 1
        ? `🎉 랜덤 뽑기 결과: [${currentWinners[0]}]`
        : `🎉 랜덤 뽑기 결과 (${currentWinners.length}명 당첨):\n` +
          currentWinners.map((w, idx) => `${idx + 1}. ${w}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <Dices className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                랜덤 뽑기
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  초간편 추첨
                </span>
              </h1>
              <p className="text-xs text-slate-400">메뉴 결정, 벌칙, 번호 추첨까지 한 번에!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
              className={`p-2 rounded-lg border transition ${
                soundEnabled
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fast mode toggle */}
            <button
              onClick={() => setFastMode(!fastMode)}
              title={fastMode ? '빠른 뽑기 켜짐' : '일반 연출'}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                fastMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${fastMode ? 'text-amber-400 fill-amber-400' : ''}`} />
              <span className="hidden sm:inline">초고속</span>
            </button>

            {/* History toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg border transition flex items-center gap-1 text-xs font-medium ${
                showHistory
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="추첨 기록"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Draw Stage & Result (7 cols on lg) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Draw Display Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-800/50 border border-slate-700/80 p-6 sm:p-8 shadow-xl text-center">
            {/* Ambient background glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Pool Status Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/50">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                추첨 가능 대상: <strong className="text-amber-400">{availableItems.length}</strong>개
              </span>
              {excludedList.length > 0 && (
                <button
                  onClick={handleResetExcluded}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition"
                  title="제외된 항목 복구하기"
                >
                  <RotateCcw className="w-3 h-3" />
                  제외 복구 ({excludedList.length})
                </button>
              )}
            </div>

            {/* Draw Arena / Display */}
            <div className="my-6 min-h-[160px] flex items-center justify-center">
              {isDrawing ? (
                /* Animated rolling display */
                <div className="flex flex-col items-center justify-center animate-bounce">
                  <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 tracking-wider py-2 break-all max-w-full px-4">
                    {rollingDisplay}
                  </div>
                  <div className="text-xs text-amber-400/80 mt-2 flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" /> 두근두근 추첨 진행 중...
                  </div>
                </div>
              ) : currentWinners && currentWinners.length > 0 ? (
                /* Winner Result Display */
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/30 mb-3">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    축하합니다! 당첨 결과
                  </span>

                  {currentWinners.length === 1 ? (
                    <div className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight break-all max-w-full px-4 py-2 drop-shadow-sm">
                      {currentWinners[0]}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-2">
                      {currentWinners.map((winner, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-slate-900/80 border border-amber-500/30 rounded-xl px-4 py-3 shadow-sm text-left"
                        >
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-base font-bold text-white truncate">{winner}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions for winner */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-700/50 w-full">
                    <button
                      onClick={handleCopyResult}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          결과 복사
                        </>
                      )}
                    </button>

                    {excludePicked && (
                      <span className="text-[11px] text-slate-400">
                        (다음 뽑기에서 당첨 항목 제외됨)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Ready State */
                <div className="flex flex-col items-center justify-center text-slate-400 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600 mb-3 border border-slate-700/60">
                    <Shuffle className="w-8 h-8 text-amber-400/50" />
                  </div>
                  <p className="text-lg font-bold text-slate-200">준비 완료!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    아래 <strong className="text-amber-400">"🎲 뽑기!"</strong> 버튼을 누르면
                    즉시 추첨됩니다
                  </p>
                </div>
              )}
            </div>

            {/* Giant Big Action Button */}
            <button
              onClick={handleStartDraw}
              disabled={isDrawing || availableItems.length === 0}
              className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-xl sm:text-2xl tracking-wide flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-2xl ${
                availableItems.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isDrawing
                  ? 'bg-amber-600 text-amber-100 cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/25 hover:shadow-orange-500/40 cursor-pointer hover:-translate-y-0.5'
              }`}
            >
              {isDrawing ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  뽑는 중...
                </>
              ) : (
                <>
                  <Dices className="w-7 h-7" />
                  {currentWinners ? '🎲 한 번 더 뽑기!' : '🎲 뽑기 시작!'}
                </>
              )}
            </button>

            {/* Empty pool notice */}
            {availableItems.length === 0 && (
              <p className="text-xs text-rose-400 mt-2 font-medium">
                추첨할 수 있는 항목이 없습니다. 항목을 추가하거나 제외를 복구해주세요.
              </p>
            )}
          </div>

          {/* Quick Settings & Options Card */}
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 sm:p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              추첨 옵션 설정
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pick count selector */}
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">뽑을 개수 (당첨 인원)</div>
                  <div className="text-[11px] text-slate-500">동시에 몇 개를 추첨할까요?</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setPickCount(cnt)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        pickCount === cnt
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exclude picked items toggle */}
              <div
                onClick={() => setExcludePicked(!excludePicked)}
                className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    중복 뽑기 방지
                    {excludePicked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">당첨된 항목은 다음 목록에서 제외</div>
                </div>
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    excludePicked ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      excludePicked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Mode Switch & Input Management (5 cols on lg) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <button
              onClick={() => {
                setMode('list');
                setCurrentWinners(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              직접 항목 뽑기
            </button>
            <button
              onClick={() => {
                setMode('number');
                setCurrentWinners(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'number'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hash className="w-4 h-4" />
              숫자 번호 뽑기
            </button>
          </div>

          {/* Mode 1: List Mode */}
          {mode === 'list' ? (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 sm:p-5 flex flex-col gap-4">
              {/* Presets */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  추천 빠른 프리셋
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-600/40 hover:border-amber-500/40 transition active:scale-95"
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    추첨 항목 목록 ({rawItems.length}개)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShuffleList}
                      title="목록 순서 섞기"
                      className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                    >
                      <Shuffle className="w-3 h-3" />
                      섞기
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      비우기
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={listText}
                  onChange={(e) => {
                    setListText(e.target.value);
                    setCurrentWinners(null);
                  }}
                  placeholder="항목을 줄바꿈(Enter) 또는 쉼표(,)로 입력하세요.&#10;예시:&#10;철수&#10;영희&#10;민수&#10;지수"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * 줄바꿈이나 쉼표로 여러 항목을 한 번에 붙여넣을 수 있습니다.
                </p>
              </div>

              {/* Single item quick add */}
              <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                  type="text"
                  value={singleItemInput}
                  onChange={(e) => setSingleItemInput(e.target.value)}
                  placeholder="새 항목 추가..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가
                </button>
              </form>

              {/* Tags Preview */}
              {rawItems.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">
                    등록된 태그 (클릭 시 삭제):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {rawItems.map((item, idx) => {
                      const isExcluded = excludedList.includes(item);
                      return (
                        <button
                          key={idx}
                          onClick={() => handleRemoveItem(item)}
                          className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 group transition ${
                            isExcluded
                              ? 'bg-slate-800/40 border-slate-800 text-slate-600 line-through'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300'
                          }`}
                        >
                          <span>{item}</span>
                          <span className="text-slate-600 group-hover:text-rose-400 text-[10px]">
                            ×
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Number Mode */
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 sm:p-5 flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                추첨 숫자 범위 설정
              </label>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">시작 번호</span>
                  <input
                    type="number"
                    value={startNum}
                    onChange={(e) => {
                      setStartNum(parseInt(e.target.value) || 1);
                      setCurrentWinners(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-center text-lg font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">끝 번호</span>
                  <input
                    type="number"
                    value={endNum}
                    onChange={(e) => {
                      setEndNum(parseInt(e.target.value) || 1);
                      setCurrentWinners(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-center text-lg font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Number Range Presets */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">자주 쓰는 번호대:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1 ~ 10', s: 1, e: 10 },
                    { label: '1 ~ 20', s: 1, e: 20 },
                    { label: '1 ~ 30', s: 1, e: 30 },
                    { label: '1 ~ 50', s: 1, e: 50 },
                  ].map((range, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setStartNum(range.s);
                        setEndNum(range.e);
                        setCurrentWinners(null);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                        startNum === range.s && endNum === range.e
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>총 번호 개수:</span>
                <strong className="text-amber-400 font-bold">
                  {Math.max(0, endNum - startNum + 1)}개 (
                  {startNum}번 ~ {endNum}번)
                </strong>
              </div>
            </div>
          )}

          {/* Draw History Section (Collapsible or bottom) */}
          {showHistory && (
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  최근 추첨 기록 ({history.length}회)
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                  >
                    기록 삭제
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  아직 추첨한 기록이 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {item.mode === 'list' ? '항목' : '숫자'}
                        </span>
                        <div className="font-semibold text-slate-200 truncate">
                          {item.results.join(', ')}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {item.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        심플 & 간편 랜덤 뽑기 · 클릭 한 번으로 공정하고 빠른 추첨
      </footer>
    </div>
  );
}
