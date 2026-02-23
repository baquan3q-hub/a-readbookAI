import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GenerationParams {
  topic: string;
  format: string;
  language: string;
  time: string;
  history?: string[];
}

export async function generateContent(params: GenerationParams): Promise<string> {
  const systemInstruction = `Bạn là một chuyên gia tổng hợp kiến thức, một người kể chuyện truyền cảm hứng và một nhà sáng tạo nội dung giáo dục xuất sắc. Nhiệm vụ của bạn là chắt lọc tinh hoa từ những cuốn sách và bài học nhân loại để tạo ra nội dung học tập theo đúng các yêu cầu dưới đây:

YÊU CẦU NỘI DUNG CHI TIẾT:
Giá trị cốt lõi: Nội dung phải đi thẳng vào trọng tâm, chứa đựng những góc nhìn sắc bén, bài học ý nghĩa và có tính ứng dụng thực tế cao. Không lan man.

Định dạng theo thể loại:
Nếu là "Bài đọc": Viết mạch lạc, chia luận điểm rõ ràng bằng các tiêu đề phụ, ngôn từ súc tích.
Nếu là "Podcast": Viết theo văn phong nói tự nhiên, có phần mở đầu lôi cuốn (hook), lời dẫn dắt thân thiện và phần kết đọng lại suy nghĩ. Thêm các ghi chú như [Cười nhẹ], [Giọng trầm xuống] để tăng tính chân thực.
Nếu là "Hội thoại/Truyện tranh": Xây dựng tình huống đời thường giữa 2-3 nhân vật, câu thoại ngắn gọn, phản xạ tự nhiên.
Nếu là "Tinh hoa Sách": Đóng vai trò là một AI Agent chuyên gia phân tích sách. Quét qua kho tàng tri thức, chọn lọc ra 1-2 cuốn sách kinh điển nhất về chủ đề được yêu cầu. Trích xuất những câu chuyện thực tế đắt giá nhất, những triết lý cốt lõi và bài học mang tính bước ngoặt. Bắt buộc nêu rõ Tên sách, Tác giả, và bối cảnh câu chuyện. Đưa ra phân tích sắc bén về ý nghĩa và hướng dẫn ứng dụng thực tiễn một cách mạnh mẽ, trực diện.

Tối ưu học ngôn ngữ (Đặc biệt cho Tiếng Anh/Song ngữ): Sử dụng từ vựng đa dạng, ngữ pháp chuẩn xác. Nếu là định dạng "Song ngữ", hãy trình bày theo từng đoạn đối chiếu (Anh - Việt) và bôi đậm các từ vựng/cấu trúc câu "ăn điểm" kèm theo một bảng giải nghĩa ngắn ở cuối bài.

Kiểm soát độ dài: Căn chỉnh số lượng từ vựng chặt chẽ để đảm bảo người dùng có thể hoàn thành việc đọc/nghe trong đúng thời gian họ đã chọn.`;

  const prompt = `THÔNG SỐ ĐẦU VÀO:
Chủ đề: ${params.topic}
Thể loại: ${params.format}
Ngôn ngữ: ${params.language}
Thời gian tiêu thụ dự kiến: ${params.time}

LỊCH SỬ HỌC TẬP CỦA NGƯỜI DÙNG:
${params.history && params.history.length > 0 ? params.history.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'Chưa có lịch sử.'}

YÊU CẦU QUAN TRỌNG: Hãy tạo ra câu chuyện và nội dung HOÀN TOÀN MỚI, KHÁC BIỆT so với những gì đã có trong Lịch sử học tập. Đa dạng hóa góc nhìn, nhân vật, và bài học để người dùng không bị nhàm chán.

Hãy dựa vào các thông số trên và bắt đầu tạo nội dung.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Không có nội dung được tạo.";
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Đã xảy ra lỗi khi tạo nội dung. Vui lòng thử lại.");
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmBase64ToWavBase64(pcmBase64: string, sampleRate: number = 24000): string {
  const binaryString = atob(pcmBase64);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }
  
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);
  
  // Write PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);
  
  let binaryWav = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < wavBytes.length; i += chunkSize) {
    binaryWav += String.fromCharCode.apply(null, Array.from(wavBytes.subarray(i, i + chunkSize)));
  }
  
  return btoa(binaryWav);
}

export async function generateAudio(text: string): Promise<string> {
  try {
    const rewritePrompt = `Hãy chuyển đổi nội dung sau thành một kịch bản audio storytelling (kể chuyện) thật cuốn hút, cảm xúc và tự nhiên bằng Tiếng Việt. 
Yêu cầu:
- Giọng điệu truyền cảm, như một người bạn đang tâm tình.
- Lược bỏ các tiêu đề, gạch đầu dòng cứng nhắc.
- Viết thành các đoạn văn liền mạch, dễ đọc thành tiếng.
- Độ dài vừa phải (khoảng 300-500 từ) để tạo audio không bị quá giới hạn.

Nội dung gốc:
${text.substring(0, 3000)}`;

    const rewriteResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: rewritePrompt,
    });
    
    const storyText = rewriteResponse.text || text;

    // Clean up text for TTS (remove markdown, notes like [Cười nhẹ])
    const cleanText = storyText.replace(/\[.*?\]/g, '').replace(/[*#_]/g, '').trim();
    // Truncate if too long to avoid API limits (approx 5000 chars)
    const textToSpeak = cleanText.length > 4500 ? cleanText.substring(0, 4500) + "..." : cleanText;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: textToSpeak }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Không thể tạo âm thanh từ nội dung này.");
    }
    
    const wavBase64 = pcmBase64ToWavBase64(base64Audio);
    return `data:audio/wav;base64,${wavBase64}`;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Đã xảy ra lỗi khi tạo âm thanh. Vui lòng thử lại.");
  }
}
