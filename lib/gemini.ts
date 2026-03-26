import { GoogleGenerativeAI } from "@google/generative-ai";
import { BodyLanguageMetrics, STARScore } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateQuestions(resumeText: string, jobDescription: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert technical interviewer. I will provide you with a candidate's resume text and a job description.
    Your task is to generate 5 interview questions specifically tailored to this candidate applying for this job.
    
    INSTRUCTIONS:
    1. Analyze the <RESUME> content to understand the candidate's skills and experience.
    2. Analyze the <JOB_DESCRIPTION> content to understand the role requirements.
    3. Generate 5 unique questions that bridge the gap between the candidate's profile and the job role.
    4. Do not confuse the resume text with the job description.
    
    The questions should be a mix of:
    - Technical questions based on the resume skills and job requirements.
    - Behavioral questions based on the candidate's experience.
    
    Return the output strictly as a JSON array of objects with the following structure:
    [
      {
        "content": "Question text here",
        "type": "technical" | "behavioral"
      }
    ]
    
    Do not include any markdown formatting like \`\`\`json. Just the raw JSON array.
    
    <RESUME>
    ${resumeText.slice(0, 10000)}
    </RESUME>
    
    <JOB_DESCRIPTION>
    ${jobDescription.slice(0, 5000)}
    </JOB_DESCRIPTION>
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

/**
 * Enhanced STAR Framework Evaluation
 * Evaluates answer based on the STAR methodology:
 * - Situation: Did they set context?
 * - Task: Did they define their responsibility?
 * - Action: Did they explain their actions?
 * - Result: Did they show measurable impact?
 */
export async function evaluateAnswerWithSTAR(question: string, answer: string): Promise<STARScore> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Evaluate the following interview answer using the STAR framework methodology.
    
    Question: "${question}"
    Answer: "${answer}"
    
    STAR Framework:
    - Situation (1-5): Did they clearly set the context and background?
    - Task (1-5): Did they define their specific responsibility or challenge?
    - Action (1-5): Did they explain the concrete actions they took?
    - Result (1-5): Did they show measurable outcomes or impact?
    
    Scoring Guide:
    1 = Missing or very weak
    2 = Somewhat present but unclear
    3 = Adequately addressed
    4 = Well-articulated with good detail
    5 = Excellent with specific, compelling details
    
    Output strictly as JSON:
    {
      "situation": 1-5,
      "task": 1-5,
      "action": 1-5,
      "result": 1-5,
      "overallSTAR": (average of above),
      "critique": "Detailed feedback on STAR structure. Mention which components are strong and which need improvement. Provide specific suggestions."
    }
    
    Do not include markdown formatting. Just the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    // Calculate overall STAR if not provided
    if (!parsed.overallSTAR) {
      parsed.overallSTAR = (parsed.situation + parsed.task + parsed.action + parsed.result) / 4;
    }

    return parsed as STARScore;
  } catch (error) {
    console.error("STAR Evaluation Error:", error);
    return {
      situation: 0,
      task: 0,
      action: 0,
      result: 0,
      overallSTAR: 0,
      critique: "Failed to evaluate answer using STAR framework."
    };
  }
}

/**
 * Analyze body language from video using Gemini Vision API
 * Extracts frames and analyzes:
 * - Eye contact consistency
 * - Facial confidence indicators
 * - Gesture appropriateness
 * - Posture and composure
 */
export async function analyzeBodyLanguage(videoBuffer: Buffer, mimeType: string): Promise<BodyLanguageMetrics> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Analyze the body language, visual presence, and vocal delivery in this interview video.

    Evaluate the following aspects on a 1-5 scale:

    1. Eye Contact (1-5):
       - Does the candidate maintain consistent eye contact with the camera?
       - 1 = Rarely looks at camera, 3 = Inconsistent, 5 = Strong, consistent eye contact

    2. Facial Confidence (1-5):
       - Do their facial expressions convey confidence and engagement?
       - 1 = Nervous or disengaged, 3 = Neutral, 5 = Confident and engaged

    3. Gestures (1-5):
       - Are hand gestures natural and appropriate?
       - 1 = No gestures or very distracting, 3 = Some gestures, 5 = Natural, emphasizing gestures

    4. Posture (1-5):
       - Do they maintain good posture and composure?
       - 1 = Poor posture/slouching, 3 = Neutral, 5 = Excellent upright posture

    5. Head Touching (1-5):
       - Does the candidate touch their head, face, or neck (nervous self-soothing behavior)?
       - 1 = Frequent touching (hair, face, neck scratching) throughout the video
       - 3 = Occasional touching
       - 5 = No self-touching, hands remain calm and controlled

    6. Speaking Volume (1-5) — assess from the audio track:
       - How clear and confident is the candidate's speaking volume?
       - 1 = Very low/mumbling, barely audible
       - 3 = Moderate volume, somewhat clear
       - 5 = Clear, confident, well-projected voice

    Output strictly as JSON:
    {
      "eyeContact": 1-5,
      "facialConfidence": 1-5,
      "gestures": 1-5,
      "posture": 1-5,
      "headTouching": 1-5,
      "speakingVolume": 1-5,
      "overallPresence": (average of all six scores above),
      "feedback": "Detailed feedback on visual presence and vocal delivery. Mention strengths and areas for improvement with specific, actionable suggestions. Call out any nervous habits like head touching or low volume."
    }

    Do not include markdown formatting. Just the JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: videoBuffer.toString("base64"),
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    // Calculate overall presence if not provided
    if (!parsed.overallPresence) {
      parsed.overallPresence = (
        parsed.eyeContact +
        parsed.facialConfidence +
        parsed.gestures +
        parsed.posture +
        parsed.headTouching +
        parsed.speakingVolume
      ) / 6;
    }

    return parsed as BodyLanguageMetrics;
  } catch (error) {
    console.error("Body Language Analysis Error:", error);
    throw new Error("Failed to analyze body language from video.");
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string) {
  // Use Gemini 1.5 Pro which has better multimodal support and is available
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  const prompt = "Transcribe the audio from this video recording. Extract only the spoken words exactly as said. Do not add any commentary, timestamps, or speaker labels. Just output the transcribed text.";

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: mimeType, // Accept video/webm or audio formats
        },
      },
    ]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Failed to transcribe audio.");
  }
}
