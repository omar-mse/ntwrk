"use client"

import { useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Sparkles, Camera, AlertCircle, X, ArrowRight } from "lucide-react"
import { ContactCard } from "@/lib/types"
import { cn } from "@/lib/utils"
import { springSnappy } from "@/lib/motion"
import { CameraCapture } from "@/components/camera-capture"

type UploadState = "idle" | "hovering" | "uploading" | "error"

interface UploadCardProps {
  onUpload: (card: ContactCard) => void
}

export function UploadCard({ onUpload }: UploadCardProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadState("uploading")
      setErrorMsg("")
      try {
        const body = new FormData()
        body.append("file", file)
        const response = await fetch("/api/analyze-card", { method: "POST", body })
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}))
          throw new Error(detail.detail ?? detail.error ?? "Could not read the card.")
        }
        const card: ContactCard = await response.json()
        setUploadState("idle")
        onUpload(card)
      } catch (err) {
        console.error("Card scan failed:", err)
        setErrorMsg(err instanceof Error ? err.message : "Could not read the card.")
        setUploadState("error")
      }
    },
    [onUpload]
  )

  function clearPending() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  async function confirmUpload() {
    if (!pendingFile) return
    const file = pendingFile
    clearPending()
    await uploadFile(file)
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPendingFile(file)
        setPendingPreviewUrl(url)
      } else {
        await uploadFile(file)
      }
    },
    [uploadFile]
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

  const isInteractive = uploadState === "idle" || uploadState === "hovering" || uploadState === "error"

  return (
    <>
    {cameraOpen && createPortal(
      <CameraCapture
        onCapture={async (file) => {
          setCameraOpen(false)
          await uploadFile(file)
        }}
        onClose={() => setCameraOpen(false)}
      />,
      document.body
    )}
    {pendingFile && pendingPreviewUrl && createPortal(
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={clearPending}
      >
        <motion.div
          className={cn(
            "relative w-full max-w-lg overflow-hidden rounded-3xl",
            "bg-white dark:bg-slate-900",
            "ring-1 ring-slate-200/80 dark:ring-slate-700/50",
            "shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60"
          )}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springSnappy}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-sm font-medium text-foreground">Review image</span>
            <button
              type="button"
              onClick={clearPending}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreviewUrl}
                alt="Selected card"
                className="w-full object-contain max-h-72"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={confirmUpload}
                className={cn(
                  "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all",
                  "bg-foreground text-background",
                  "hover:bg-foreground/85 active:scale-95"
                )}
              >
                Continue
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>,
      document.body
    )}
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-7",
        "min-h-[260px] flex flex-col items-center justify-center",
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
        {uploadState === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <AlertCircle className="size-7 text-destructive/70" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-destructive/80">Couldn&apos;t read the card</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60 max-w-[160px]">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUploadState("idle") }}
              className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Try again
            </button>
          </motion.div>
        ) : uploadState === "uploading" ? (
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

            {/* Camera option */}
            <div
              className="mt-1 flex flex-col items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] text-muted-foreground/40 select-none">— or —</span>
              <button
                type="button"
                aria-label="Take photo with camera"
                onClick={(e) => {
                  e.stopPropagation()
                  setCameraOpen(true)
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium",
                  "text-muted-foreground transition-colors duration-200",
                  "ring-1 ring-slate-200 dark:ring-slate-700",
                  "hover:bg-muted hover:text-foreground hover:ring-slate-300 dark:hover:ring-slate-600"
                )}
              >
                <Camera className="size-3.5" strokeWidth={1.75} />
                Use camera
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
