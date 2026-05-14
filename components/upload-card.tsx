"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Sparkles } from "lucide-react"
import { ContactCard } from "@/lib/types"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "hovering" | "uploading"

interface UploadCardProps {
  onUpload: (card: ContactCard) => void
}

export function UploadCard({ onUpload }: UploadCardProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      setUploadState("uploading")
      try {
        const body = new FormData()
        body.append("file", file)
        const response = await fetch("/api/analyze-card", { method: "POST", body })
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}))
          throw new Error(`Upload failed: ${response.status} — ${detail.detail ?? detail.error ?? "unknown"}`)
        }
        const card: ContactCard = await response.json()
        setUploadState("idle")
        onUpload(card)
      } catch (err) {
        console.error("Card scan failed:", err)
        setUploadState("idle")
      }
    },
    [onUpload]
  )

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (uploadState === "idle") setUploadState("hovering")
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setUploadState("idle")
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    handleFiles(e.dataTransfer.files)
  }

  const isInteractive = uploadState === "idle" || uploadState === "hovering"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-7",
        "h-[237px] flex flex-col items-center justify-center",
        "bg-white/80 dark:bg-slate-900/60",
        "backdrop-blur-md",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
        uploadState === "idle" &&
          "border-2 border-dashed border-slate-200 dark:border-slate-700",
        uploadState === "hovering" &&
          "border-2 border-dashed border-primary/40 dark:border-primary/30 shadow-[0_0_0_4px_hsl(var(--ring)/0.08)]",
        uploadState === "uploading" &&
          "ring-1 ring-slate-200/80 dark:ring-slate-700/50",
        isInteractive && "cursor-pointer"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => isInteractive && inputRef.current?.click()}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label="Upload a business card image"
      onKeyDown={(e) => e.key === "Enter" && isInteractive && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden="true"
      />

      {/* Shimmer during upload */}
      <AnimatePresence>
        {uploadState === "uploading" && (
          <motion.div
            key="shimmer"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {uploadState === "uploading" ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="size-7 text-primary/60" strokeWidth={1.5} />
            </motion.div>
            <p className="text-sm text-muted-foreground">Scanning with AI…</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <motion.div
              animate={
                uploadState === "hovering"
                  ? { y: [-2, 2, -2], transition: { duration: 0.8, repeat: Infinity } }
                  : { y: 0 }
              }
            >
              <Upload
                className={cn(
                  "size-7 transition-colors duration-300",
                  uploadState === "hovering" ? "text-primary" : "text-muted-foreground/50"
                )}
                strokeWidth={1.5}
              />
            </motion.div>
            <div>
              <p
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  uploadState === "hovering" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {uploadState === "hovering" ? "Drop to scan" : "Drop a business card"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/50">or click to browse · PNG, JPG, PDF</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
