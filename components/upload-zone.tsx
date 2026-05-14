"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Sparkles, CheckCircle2 } from "lucide-react"
import { ContactCard } from "@/lib/types"
import { spring, springSnappy } from "@/lib/motion"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "hovering" | "uploading" | "success"

interface UploadZoneProps {
  onUpload: (card: ContactCard) => void
}

export function UploadZone({ onUpload }: UploadZoneProps) {
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
        onUpload(card)
        setUploadState("success")
        setTimeout(() => setUploadState("idle"), 2000)
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
    <motion.div
      animate={{
        scale: uploadState === "hovering" ? 1.012 : 1,
      }}
      transition={spring}
      className="mb-8"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-8 transition-all duration-300",
          "bg-white/60 dark:bg-slate-900/40",
          "backdrop-blur-md",
          uploadState === "idle" &&
            "border-2 border-dashed border-slate-200 dark:border-slate-700",
          uploadState === "hovering" &&
            "border-2 border-dashed border-primary/40 dark:border-primary/30 shadow-[0_0_0_4px_hsl(var(--ring)/0.08)]",
          uploadState === "uploading" &&
            "border-2 border-solid border-primary/20 dark:border-primary/10",
          uploadState === "success" &&
            "border-2 border-solid border-emerald-400/50 dark:border-emerald-500/30",
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

        {/* Shimmer overlay during upload */}
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

        {/* Concentric rings during upload */}
        <AnimatePresence>
          {uploadState === "uploading" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-primary/20"
                  style={{ width: 64, height: 64 }}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{
                    delay: i * 0.5,
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center gap-3 py-6 text-center">
          <AnimatePresence mode="wait">
            {uploadState === "success" ? (
              <motion.div
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={springSnappy}
                className="flex flex-col items-center gap-2"
              >
                <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={1.5} />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Card added!
                </p>
              </motion.div>
            ) : uploadState === "uploading" ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
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
                className="flex flex-col items-center gap-2"
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
                      uploadState === "hovering"
                        ? "text-primary"
                        : "text-muted-foreground/60"
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
                    {uploadState === "hovering"
                      ? "Drop to scan"
                      : "Drop a business card"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    or click to browse · PNG, JPG, PDF
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
