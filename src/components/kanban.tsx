"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stage,
  STAGES,
  PLATFORMS,
  primaryChannel,
  totalFollowers,
  fmtMoneyCents,
  fmtNum,
} from "@/lib/creator-meta";
import type { CreatorRow } from "@/components/dashboard-view";
import { CreatorAvatar } from "@/components/creator-avatar";

export function KanbanBoard({
  rows,
  onStageChange,
}: {
  rows: CreatorRow[];
  onStageChange: (id: string, stage: Stage) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // Small activation distance so plain clicks still open the creator page.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const creatorId = String(e.active.id);
    const overStage = e.over?.id as Stage | undefined;
    if (!overStage) return;
    const row = rows.find((r) => r.id === creatorId);
    if (row && row.stage !== overStage) onStageChange(creatorId, overStage);
  }

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3 items-start">
        {STAGES.map((s) => (
          <Column key={s.key} stage={s} rows={rows.filter((r) => r.stage === s.key)} />
        ))}
      </div>
      <DragOverlay>{activeRow ? <Card row={activeRow} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  rows,
}: {
  stage: (typeof STAGES)[number];
  rows: CreatorRow[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      className="card flex-none w-[230px] p-2"
      style={isOver ? { outline: "2px solid var(--accent)", outlineOffset: -1 } : undefined}
    >
      <div className="flex items-center gap-1.5 px-1.5 py-1 mb-1 text-xs font-semibold text-ink-2">
        <span className="dot" style={{ background: stage.colorVar }} />
        {stage.label}
        <span className="ml-auto text-ink-3 font-normal tabular-nums">{rows.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 min-h-[60px]">
        {rows.map((r) => (
          <DraggableCard key={r.id} row={r} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ row }: { row: CreatorRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id });
  const router = useRouter();

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.35 : 1 }}
      onClick={() => router.push(`/creators/${row.id}`)}
    >
      <Card row={row} />
    </div>
  );
}

function Card({ row, overlay = false }: { row: CreatorRow; overlay?: boolean }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2 cursor-grab text-[13px]"
      style={{
        background: "var(--page)",
        border: "1px solid var(--edge)",
        boxShadow: overlay ? "0 6px 20px rgba(0,0,0,0.25)" : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <CreatorAvatar creator={row} size={24} />
        <div className="font-semibold leading-tight">{row.name}</div>
      </div>
      <div className="text-xs text-ink-3 mt-0.5">
        {(() => {
          const primary = primaryChannel(row);
          return primary ? `${PLATFORMS[primary.platform].label} · ${primary.handle}` : "no contact on file";
        })()}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-ink-2">
        <span>{totalFollowers(row) > 0 ? `${fmtNum(totalFollowers(row))} fol.` : ""}</span>
        <span className="tabular-nums">
          {row.agreedCostCents != null ? fmtMoneyCents(row.agreedCostCents) : ""}
        </span>
      </div>
    </div>
  );
}
