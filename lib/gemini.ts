import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateQuestions(resumeText: string, jobDescription: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini Raw Response:", text); // Debug log

    // Clean up if markdown code fence is present
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback Mock Data so the user can test the UI even if API key is invalid
    console.warn("⚠️ RETURNING MOCK DATA due to API Error");
    return [
      { content: "Describe a challenging technical problem you solved recently. (MOCK)", type: "behavioral" },
      { content: "How do you handle state management in React applications? (MOCK)", type: "technical" },
      { content: "Explain the difference between server-side and client-side rendering. (MOCK)", type: "technical" },
      { content: "Tell me about a time you disagreed with a team member. (MOCK)", type: "behavioral" },
      { content: "What is your experience with TypeScript generics? (MOCK)", type: "technical" }
    ];
  }
}
export async function evaluateAnswer(question: string, answer: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Evaluate the following interview answer based on Clarity, Relevance, and STAR structure.
    
    Question: "${question}"
    Answer: "${answer}"
    
    Output strictly as JSON:
    {
      "clarity": 1-5,
      "relevance": 1-5,
      "star_score": 1-5,
      "critique": "Detailed feedback focusing on how to improve."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Evaluation Error:", error);
    return {
      clarity: 0,
      relevance: 0,
      star_score: 0,
      critique: "Failed to evaluate answer."
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = "Transcribe the following audio of an interview answer exactly as spoken. Do not add any commentary, timestamps, or speaker labels. Just the text.";

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: mimeType,
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
