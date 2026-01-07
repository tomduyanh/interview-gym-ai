'use server';

import { parsePDF } from "@/lib/pdf-parser";
import { generateQuestions, evaluateAnswer } from "@/lib/gemini";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
import { createClient } from "@supabase/supabase-js";
import { Question } from "@/lib/types";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveSession(questions: Question[], answers: string[], resumeText: string, jobDescription: string) {
    try {
        // Merge questions and answers for storage
        const sessionData = questions.map((q, i) => ({
            ...q,
            answer: answers[i] || ""
        }));

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert({
                questions: sessionData,
                resume_snapshot: resumeText,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { success: true, session: data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Save Session Error:", error);
        return { success: false, error: message };
    }
}

export async function generateInterviewQuestions(formData: FormData) {
    try {
        const file = formData.get('resume') as File;
        const jobDescription = formData.get('jobDescription') as string;

        if (!file) throw new Error("No resume uploaded");
        if (!jobDescription) throw new Error("No job description provided");

        // 1. Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const resumeText = await parsePDF(buffer);

        // 2. Generate Questions
        const questions = await generateQuestions(resumeText, jobDescription);

        return { success: true, questions: questions as Question[], resumeText };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in generateInterviewQuestions:", error);
        return { success: false, error: message };
    }
}
export async function evaluateSessionAnswers(sessionId: string) {
    try {
        const { data: session, error: fetchError } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError) throw new Error(fetchError.message);

        const evaluations = [];
        for (const item of session.questions) {
            const evaluation = await evaluateAnswer(item.content, item.answer);
            evaluations.push({
                question: item.content,
                answer: item.answer,
                evaluation
            });
        }

        // Save evaluations back to session or a separate results table
        // For now, let's just return them. In a real app, we'd update the session.
        return { success: true, evaluations };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Evaluation Error:", error);
        return { success: false, error: message };
    }
}
