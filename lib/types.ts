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
