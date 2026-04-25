type ForestTabProps = {
  growthEnergyPercent: number;
  streakCount: number;
  totalPoints: number;
};

type FieldItem = {
  id: string;
  emoji: string;
  top: number;
  left: number;
  size: number;
  zIndex: number;
};

function seededPercent(seed: number) {
  const value = Math.sin(seed * 999.37) * 10000;
  return value - Math.floor(value);
}

function createFieldItem(index: number, emoji: string): FieldItem {
  return {
    id: `${emoji}-${index}`,
    emoji,
    top: 6 + seededPercent(index + 3) * 84,
    left: 5 + seededPercent(index + 17) * 88,
    size: 18 + Math.round(seededPercent(index + 31) * 18),
    zIndex: 1 + Math.round(seededPercent(index + 47) * 8),
  };
}

function buildFieldEmojis(totalPoints: number): FieldItem[] {
  const items: string[] = [];
  const baseLifeCount = Math.min(18, 3 + Math.floor(totalPoints / 90));
  for (let index = 0; index < baseLifeCount; index += 1) {
    items.push(index % 4 === 0 ? "🌼" : "🌱");
  }

  if (totalPoints >= 1000) {
    const treeCount = Math.min(18, 3 + Math.floor((Math.min(totalPoints, 9999) - 1000) / 650));
    for (let index = 0; index < treeCount; index += 1) {
      items.push(index % 3 === 0 ? "🌲" : "🌳");
    }
  }

  if (totalPoints >= 10000) {
    const forestCount = Math.min(26, 12 + Math.floor((Math.min(totalPoints, 19999) - 10000) / 420));
    for (let index = 0; index < forestCount; index += 1) {
      items.push(index % 2 === 0 ? "🌳" : "🌲");
    }
  }

  if (totalPoints >= 20000) {
    const denseCount = Math.min(34, 18 + Math.floor((Math.min(totalPoints, 29999) - 20000) / 330));
    for (let index = 0; index < denseCount; index += 1) {
      items.push(index % 4 === 0 ? "🌲" : "🌳");
    }
  }

  if (totalPoints >= 30000) {
    const animalCount = Math.min(12, 3 + Math.floor((totalPoints - 30000) / 900));
    const animals = ["🐦", "🦌", "🐇"];
    for (let index = 0; index < animalCount; index += 1) {
      items.push(animals[index % animals.length]);
    }
  }

  return items.map((emoji, index) => createFieldItem(index, emoji));
}

function getNextMilestone(totalPoints: number) {
  if (totalPoints < 1000) return 1000;
  if (totalPoints < 10000) return 10000;
  if (totalPoints < 20000) return 20000;
  if (totalPoints < 30000) return 30000;
  return Math.ceil((totalPoints + 1) / 10000) * 10000;
}

export function ForestTab({ growthEnergyPercent, streakCount, totalPoints }: ForestTabProps) {
  const fieldItems = buildFieldEmojis(totalPoints);
  const nextMilestone = getNextMilestone(totalPoints);
  const milestoneBase =
    nextMilestone <= 1000 ? 0 : nextMilestone === 10000 ? 1000 : nextMilestone === 20000 ? 10000 : nextMilestone - 10000;
  const milestoneProgress = Math.min(100, Math.round(((totalPoints - milestoneBase) / (nextMilestone - milestoneBase)) * 100));

  return (
    <section className="mb-6 rounded-3xl border border-[#D7C6A6] bg-[#F6EBD5] p-5 shadow-sm">
      <div className="mb-6 text-center">
        <p className="text-sm tracking-wide text-stone-500">My Forest</p>
        <h1 className="mt-1 text-2xl font-semibold text-sage-deep">나만의 들판</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          소목표를 달성할 때마다 포인트가 쌓이고, 빈 들판이 천천히 숲으로 변해요.
        </p>
      </div>

      <div className="relative h-[360px] overflow-hidden rounded-[2rem] border border-[#D5C4A1] bg-[#f5f5dc] shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(123,99,64,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.26),rgba(139,107,62,0.10))]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[#D6BE91]/35" />
        {fieldItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-stone-500">
            아직은 고요한 빈 들판이에요. 홈에서 첫 소목표를 완료해 씨앗을 심어보세요.
          </div>
        ) : (
          fieldItems.map((item) => (
            <span
              key={item.id}
              className="absolute select-none transition-transform duration-500 hover:scale-125"
              style={{
                top: `${item.top}%`,
                left: `${item.left}%`,
                fontSize: `${item.size}px`,
                zIndex: item.zIndex,
                transform: `translate(-50%, -50%) rotate(${Math.round(seededPercent(item.zIndex + item.size) * 18) - 9}deg)`,
              }}
              aria-hidden
            >
              {item.emoji}
            </span>
          ))
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-white/80 p-4 ring-1 ring-sage-light/50">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-sage-deep">누적 포인트</span>
          <span className="font-bold text-stone-700">{totalPoints.toLocaleString()} pt</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#E6D7B8]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage-deep to-emerald-400 transition-[width] duration-500"
            style={{ width: `${milestoneProgress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-stone-500">다음 변화까지 {nextMilestone.toLocaleString()} pt</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/70 p-3 text-center ring-1 ring-sage-light/40">
          <p className="text-xs text-stone-500">오늘 성장 에너지</p>
          <p className="mt-1 text-lg font-bold text-sage-deep">{growthEnergyPercent}%</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 text-center ring-1 ring-sage-light/40">
          <p className="text-xs text-stone-500">연속 성장</p>
          <p className="mt-1 text-lg font-bold text-sage-deep">{streakCount}일</p>
        </div>
      </div>
    </section>
  );
}
