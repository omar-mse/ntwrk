"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, X, Sparkles, RotateCcw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { springSnappy } from "@/lib/motion"

interface CameraCaptureProps {
  onCapture: (file: File) => void | Promise<void>
  onClose: () => void
}

type CameraState = "starting" | "ready" | "captured" | "error"

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>("starting")
  const [errorMsg, setErrorMsg] = useState("")
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraState("ready")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ""
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setErrorMsg("Camera access was denied. Allow camera access in your browser settings, or use the upload option instead.")
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setErrorMsg("No camera found on this device. Use the upload option instead.")
        } else {
          setErrorMsg("Camera unavailable. Please use the upload option instead.")
        }
        setCameraState("error")
      })

    return () => {
      cancelled = true
      stopStream()
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        stopStream()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    }
  }, [capturedUrl])

  async function handleCapture() {
    if (!videoRef.current || cameraState !== "ready") return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")!.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], "camera-card.jpg", { type: "image/jpeg" })
        const url = URL.createObjectURL(blob)
        setCapturedFile(file)
        setCapturedUrl(url)
        setCameraState("captured")
      },
      "image/jpeg",
      0.92
    )
  }

  function handleRetake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedFile(null)
    setCapturedUrl(null)
    setCameraState("ready")
  }

  async function handleConfirm() {
    if (!capturedFile) return
    stopStream()
    onCapture(capturedFile)
  }

  function handleClose() {
    stopStream()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="camera-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
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
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={springSnappy}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium text-foreground">
                {cameraState === "captured" ? "Review photo" : "Scan with camera"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close camera"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-5">
            {cameraState === "error" ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl bg-muted/40 px-6 text-center">
                <Camera className="size-8 text-muted-foreground/40" strokeWidth={1.25} />
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-1 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/80"
                >
                  Close
                </button>
              </div>
            ) : cameraState === "captured" && capturedUrl ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="captured"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedUrl}
                      alt="Captured card"
                      className="w-full object-contain max-h-72"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                        "text-muted-foreground ring-1 ring-slate-200 dark:ring-slate-700",
                        "hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <RotateCcw className="size-3.5" strokeWidth={2} />
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
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
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                {/* Video preview */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-950">
                  {cameraState === "starting" && (
                    <div className="flex h-[240px] items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="size-6 text-white/30" strokeWidth={1.5} />
                      </motion.div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "w-full object-cover",
                      cameraState === "starting" ? "hidden" : "block"
                    )}
                  />
                  {/* Framing guide overlay */}
                  {cameraState === "ready" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-[54%] w-[86%] rounded-xl border-2 border-dashed border-white/30" />
                    </div>
                  )}
                </div>

                {/* Hint + capture button */}
                <div className="mt-4 flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground/60">
                    Position the card within the frame, then capture
                  </p>
                  <button
                    type="button"
                    disabled={cameraState !== "ready"}
                    onClick={handleCapture}
                    aria-label="Capture photo"
                    className={cn(
                      "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all",
                      "bg-foreground text-background",
                      "hover:bg-foreground/85 active:scale-95",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <Camera className="size-4" strokeWidth={1.75} />
                    Capture
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
