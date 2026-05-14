"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { ContactCard as ContactCardType } from "@/lib/types"
import { ContactCard } from "./contact-card"
import { CardDetail } from "./card-detail"
import { CardPreview } from "./card-preview"
import { UploadCard } from "./upload-card"
import { spring } from "@/lib/motion"

interface CardGridProps {
  cards: ContactCardType[]
  notes: Record<string, string>
  onUpload: (card: ContactCardType) => void
  onNotesChange: (id: string, value: string) => void
  onDelete: (id: string) => void
  onCategoryChange: (id: string, category: string, accent: string) => void
}

export function CardGrid({ cards, notes, onUpload, onNotesChange, onDelete, onCategoryChange }: CardGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewCard, setPreviewCard] = useState<ContactCardType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const selectedCard = selectedId ? cards.find((c) => c.id === selectedId) ?? null : null

  function handleClose() {
    setSelectedId(null)
  }

  function handleDelete(id: string) {
    setSelectedId(null)
    setDeletingId(id)
  }

  useEffect(() => {
    if (deletingId && !cards.some((c) => c.id === deletingId)) {
      setDeletingId(null)
    }
  }, [cards, deletingId])

  function handlePreviewConfirm(card: ContactCardType) {
    setPreviewCard(null)
    onUpload(card)
  }

  return (
    <LayoutGroup>
      {/* Masonry grid */}
      <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
        {/* Upload card — always first */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ y: spring }}
          className="mb-6 break-inside-avoid"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          style={{ willChange: "transform" }}
        >
          <UploadCard onUpload={setPreviewCard} />
        </motion.div>

        {cards.map((card, i) => {
          const isDeleting = deletingId === card.id
          return (
            <motion.div
              key={card.id}
              layoutId={isDeleting ? undefined : `card-${card.id}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: selectedId === card.id || isDeleting ? 0 : 1,
                scale: isDeleting ? 0.88 : 1,
                y: 0,
              }}
              transition={{
                opacity: { duration: isDeleting ? 0.22 : 0.15 },
                scale: { duration: 0.22, ease: "easeOut" },
                y: { delay: Math.min(i * 0.04, 0.3), ...spring },
                layout: spring,
              }}
              onAnimationComplete={() => {
                if (isDeleting) {
                  onDelete(card.id)
                }
              }}
              onClick={() => !isDeleting && setSelectedId(card.id)}
              className="mb-6 cursor-pointer break-inside-avoid rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              tabIndex={isDeleting ? -1 : 0}
              role="button"
              aria-label={`View ${card.name} at ${card.company}`}
              onKeyDown={(e) => e.key === "Enter" && !isDeleting && setSelectedId(card.id)}
              whileHover={isDeleting ? {} : { y: -3, transition: { duration: 0.2 } }}
              style={{ willChange: "transform" }}
            >
              <ContactCard card={card} />
            </motion.div>
          )
        })}
      </div>

      {/* Preview overlay — shown after AI scan, before card is added */}
      <AnimatePresence>
        {previewCard && (
          <>
            <motion.div
              key="preview-backdrop"
              className="fixed inset-0 z-40"
              style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.35)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPreviewCard(null)}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
              aria-modal="true"
              role="dialog"
              aria-label="Review scanned card"
            >
              <motion.div
                key="preview-panel"
                className="pointer-events-auto w-full max-w-lg"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={spring}
              >
                <CardPreview
                  card={previewCard}
                  onConfirm={handlePreviewConfirm}
                  onCancel={() => setPreviewCard(null)}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Expanded overlay */}
      <AnimatePresence>
        {selectedId && selectedCard && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40"
              style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.35)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Card morph container */}
            <div
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
              aria-modal="true"
              role="dialog"
              aria-label={`${selectedCard.name} at ${selectedCard.company}`}
            >
              <motion.div
                layoutId={`card-${selectedId}`}
                className="pointer-events-auto w-full max-w-lg"
                transition={{ ...spring, duration: 0.35 }}
              >
                <CardDetail
                  card={selectedCard}
                  notes={notes[selectedCard.id] ?? selectedCard.userNotes}
                  onNotesChange={(val) => onNotesChange(selectedCard.id, val)}
                  onClose={handleClose}
                  onDelete={() => handleDelete(selectedCard.id)}
                  onCategoryChange={(cat, accent) => onCategoryChange(selectedCard.id, cat, accent)}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}
