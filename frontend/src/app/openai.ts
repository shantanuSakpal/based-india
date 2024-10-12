import OpenAI from "openai";

const NEXT_PUBLIC_OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!NEXT_PUBLIC_OPENAI_API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_OPENAI_API_KEY is not set in the environment variables"
  );
}

export const openai = new OpenAI({
  apiKey: NEXT_PUBLIC_OPENAI_API_KEY,
});
