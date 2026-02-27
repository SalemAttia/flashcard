import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase/config";
import { ChecklistItemId, DailyProgress } from "../types";
import { sanitize } from "./firestore";

const DEFAULT_ITEMS = [
    { id: "study_deck" as const, label: "Study a Deck", sublabel: "Review your flashcards", timeOfDay: "morning" as const },
    { id: "grammar_quiz" as const, label: "Grammar Quiz", sublabel: "Practice grammar rules", timeOfDay: "morning" as const },
    { id: "writing_test" as const, label: "Writing Practice", sublabel: "Write in Danish", timeOfDay: "afternoon" as const },
    { id: "chat_session" as const, label: "Chat in Danish", sublabel: "Have a conversation", timeOfDay: "afternoon" as const },
];

function getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Directly marks a core daily task as completed in the daily progress document.
 * Uses a Firestore transaction to avoid race conditions with the progress store.
 */
export async function markDailyTaskComplete(
    userId: string,
    taskId: ChecklistItemId,
): Promise<void> {
    const today = getToday();
    const dayRef = doc(db, "users", userId, "days", today);

    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(dayRef);

        const dayData: DailyProgress = snap.exists()
            ? (snap.data() as DailyProgress)
            : { date: today, items: DEFAULT_ITEMS.map((i) => ({ ...i })), customItems: [] };

        const now = new Date().toISOString();
        const updatedItems = dayData.items.map((item) =>
            item.id === taskId && !item.completedAt && !item.manuallyUncompleted
                ? { ...item, completedAt: now }
                : item,
        );

        const hasChanges = updatedItems.some(
            (item, idx) => item.completedAt !== dayData.items[idx].completedAt,
        );

        if (hasChanges) {
            transaction.set(dayRef, sanitize({ ...dayData, items: updatedItems }));
        }
    });
}
