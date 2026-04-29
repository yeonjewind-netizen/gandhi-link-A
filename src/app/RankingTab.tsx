import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type RankingUser = {
  uid: string;
  name: string;
  points: number;
  photoURL: string;
  email: string;
};

const DEVELOPER_EMAIL = "yeonje@example.com";

function getRankMedal(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}.`;
}

export function RankingTab() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const rankingQuery = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
        const snapshot = await getDocs(rankingQuery);
        const users = snapshot.docs.map((docItem) => {
          const data = docItem.data() as Partial<RankingUser>;
          return {
            uid: (data.uid ?? "").toString(),
            name: (data.name ?? "").toString() || "이름 없음",
            points: Number(data.points ?? 0) || 0,
            photoURL: (data.photoURL ?? "").toString(),
            email: (data.email ?? "").toString(),
          };
        });
        setRanking(users);
        setErrorMessage("");
      } catch {
        setErrorMessage("랭킹을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRanking();
  }, []);

  return (
    <section className="mb-6 rounded-3xl border border-sage-light/60 bg-white p-5 shadow-sm">
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-deep">Ranking</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-800">멀티플레이 랭킹</h1>
        <p className="mt-2 text-sm text-stone-600">친구들과 누적 포인트 순위를 겨뤄보세요.</p>
      </div>

      {isLoading ? (
        <p className="rounded-2xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">랭킹 불러오는 중...</p>
      ) : errorMessage ? (
        <p className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-red-600">{errorMessage}</p>
      ) : ranking.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">아직 등록된 유저가 없어요.</p>
      ) : (
        <ol className="space-y-2">
          {ranking.map((user, index) => (
            <li
              key={`${user.name}-${index}`}
              className="flex items-center justify-between rounded-2xl border border-sage-light/50 bg-[#FAF7F2] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 text-lg">{getRankMedal(index)}</span>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`${user.name} 프로필`}
                    className="h-7 w-7 rounded-full border border-stone-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span className="font-semibold text-stone-800">{user.name}</span>
                {user.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    👑 개발자
                  </span>
                ) : null}
              </div>
              <span className="text-sm font-bold text-sage-deep">{user.points.toLocaleString()} pt</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
