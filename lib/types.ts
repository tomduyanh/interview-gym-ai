export type PersonaType = 'senior' | 'junior' | 'rambler' | 'unstructured';

export type Question = {
    content: string;
    type: 'technical' | 'behavioral';
};

export interface Evaluation {
    question: string;
    answer: string;
    evaluation: {
        clarity: number;
        relevance: number;
        star_score: number;
        critique: string;
    };
}

export type ScoredAnswer = {
    answer: string;
    scores: {
        clarity: number;
        relevance: number;
        star: number;
    };
    feedback: string;
}

// Video Recording Types
export interface VideoRecording {
    questionIndex: number;
    url: string;
    duration?: number;
    fileSize?: number;
    mimeType: string;
    uploadedAt: string;
}

// Body Language Analysis Types
export interface BodyLanguageMetrics {
    eyeContact: number; // 1-5 scale
    facialConfidence: number; // 1-5 scale
    gestures: number; // 1-5 scale (appropriateness)
    posture: number; // 1-5 scale (composure)
    headTouching: number; // 1-5 scale (5 = no touching, 1 = frequent self-touching)
    speakingVolume: number; // 1-5 scale (5 = clear confident volume, 1 = very low/mumbling)
    overallPresence: number; // 1-5 scale (calculated average)
    feedback: string; // Detailed feedback on visual presence
}

// STAR Framework Evaluation Types
export interface STARScore {
    situation: number; // 1-5: Did they set context?
    task: number; // 1-5: Did they define responsibility?
    action: number; // 1-5: Did they explain actions taken?
    result: number; // 1-5: Did they show measurable impact?
    overallSTAR: number; // 1-5: Average of all components
    critique: string; // Detailed STAR feedback
}

// Enhanced Evaluation combining STAR + Visual
export interface EnhancedEvaluation {
    questionIndex: number;
    question: string;
    answer: string;
    videoUrl?: string;

    // Content Evaluation (STAR)
    starScore: STARScore;

    // Visual Evaluation (Body Language)
    visualMetrics?: BodyLanguageMetrics;

    // Combined Score (weighted: 70% content, 30% visual)
    combinedScore: number;

    // Overall Feedback
    recommendations: string[];
}

// Session with Enhanced Data
export interface InterviewSession {
    id: string;
    questions: (Question & { answer: string })[];
    resume_snapshot: string;
    video_urls: VideoRecording[];
    visual_analysis: Record<number, BodyLanguageMetrics>;
    enhanced_evaluations: EnhancedEvaluation[];
    analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
}

