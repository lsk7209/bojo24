/* eslint-disable no-console */
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY 환경 변수가 필요합니다.");
}

const main = async () => {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        // 모델 리스트 조회 기능은 admin SDK가 필요할 수 있으므로, 
        // 가장 단순하게 기본 모델로 1건 생성을 시도해 봅니다.
        console.log("모델 테스트: gemini-2.5-flash-lite");
        const result = await model.generateContent("테스트");
        console.log("성공! 응답:", result.response.text());
    } catch (err: any) {
        console.error("gemini-2.5-flash-lite 실패:", err.message);

        // Fallback: gemini-1.5-flash 시도
        console.log("모델 테스트: gemini-1.5-flash (fallback)");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result2 = await model2.generateContent("테스트");
            console.log("성공! 응답:", result2.response.text());
        } catch (err2: any) {
            console.error("gemini-1.5-flash 실패:", err2.message);
        }
    }
};

main();
