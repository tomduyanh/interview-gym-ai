'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video, Square, Loader2 } from 'lucide-react'
import { transcribeAudioAction } from '@/app/actions'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { VideoRecording } from '@/lib/types'

interface AnswerRecorderProps {
    onTranscriptionComplete: (text: string) => void
    onVideoUploaded?: (videoRecording: VideoRecording) => void
    sessionId?: string
    questionIndex: number
    onProcessingChange?: (isProcessing: boolean) => void
}

export function AnswerRecorder({ onTranscriptionComplete, onVideoUploaded, sessionId, questionIndex, onProcessingChange }: AnswerRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        onProcessingChange?.(isRecording || isTranscribing || isUploading);
    }, [isRecording, isTranscribing, isUploading, onProcessingChange]);

    useEffect(() => {
        // Build cleanup
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [stream])

    // Ensure video element displays the stream whenever it changes
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(err => {
                console.error("Error playing video in useEffect:", err)
            })
        }
    }, [stream])

    const startRecording = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 640, height: 480, facingMode: "user" }
            })
            setStream(newStream)

            // Stream will be connected to video element by useEffect

            const mediaRecorder = new window.MediaRecorder(newStream, { mimeType: 'video/webm' })
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' })

                // Upload video (happens in parallel with transcription)
                handleVideoUpload(blob);

                // Only attempt transcription if file is small enough (<50MB)
                if (blob.size < 50 * 1024 * 1024) {
                    handleTranscription(blob);
                } else {
                    setIsTranscribing(false);
                }

                // Stop all tracks
                newStream.getTracks().forEach(track => track.stop())
                setStream(null)
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error accessing camera/microphone:", err)
            alert("Could not access camera/microphone. Please allow permissions.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsTranscribing(true)
        }
    }

    const handleTranscription = async (blob: Blob) => {
        try {
            const formData = new FormData()
            formData.append('audio', blob, 'recording.webm')

            const result = await transcribeAudioAction(formData)

            if (result.success && result.text) {
                onTranscriptionComplete(result.text)
            } else {
                console.error("Transcription failed:", result.error)
                // Show error to user since transcription is part of the workflow
                alert("Transcription failed. Please type your answer manually.")
            }
        } catch (error) {
            console.error("Transcription error:", error)
            alert("Transcription unavailable. Please type your answer manually.")
        } finally {
            setIsTranscribing(false)
        }
    }

    const handleVideoUpload = async (blob: Blob) => {
        if (!onVideoUploaded || !sessionId) {
            // Skip upload if no callback or sessionId provided
            return;
        }

        setIsUploading(true);
        try {
            const fileName = `${sessionId}/${questionIndex}.webm`;

            // Direct upload to Supabase Storage from client
            const { error } = await supabase.storage
                .from('interview-videos')
                .upload(fileName, blob, {
                    contentType: 'video/webm',
                    upsert: true, // Allow overwriting if re-recording
                });

            if (error) {
                console.error('Video upload failed:', error);
                // Don't alert user - transcription still works
                return;
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
                .from('interview-videos')
                .getPublicUrl(fileName);

            const videoRecording: VideoRecording = {
                questionIndex,
                url: urlData.publicUrl,
                mimeType: 'video/webm',
                fileSize: blob.size,
                uploadedAt: new Date().toISOString()
            };

            onVideoUploaded(videoRecording);
        } catch (error) {
            console.error('Error uploading video:', error);
        } finally {
            setIsUploading(false);
        }
    }


    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Video Preview */}
            {(isRecording || stream) && (
                <Card className="overflow-hidden border-2 border-primary/20 bg-black/5 w-full max-w-md aspect-video relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain transform scale-x-[-1]" // Mirror effect
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-white font-medium bg-black/50 px-2 py-0.5 rounded">REC</span>
                    </div>
                </Card>
            )}

            <div className="flex items-center gap-2">
                {!isRecording ? (
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={startRecording}
                        disabled={isTranscribing || isUploading}
                        className="gap-2 min-w-[200px]"
                    >
                        {isTranscribing || isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isTranscribing && isUploading ? 'Processing...' :
                                    isTranscribing ? 'Transcribing...' : 'Uploading...'}
                            </>
                        ) : (
                            <>
                                <Video className="h-4 w-4" />
                                Record Answer (Video)
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        size="default"
                        onClick={stopRecording}
                        className="gap-2 min-w-[200px] animate-pulse"
                    >
                        <Square className="h-4 w-4 fill-current" />
                        Stop Recording
                    </Button>
                )}
            </div>
        </div>
    )
}

