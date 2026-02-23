import { supabase } from './supabaseClient';

export interface HistoryItem {
    id: string;
    topic: string;
    format: string;
    language: string;
    time_estimate: string;
    content: string;
    audio_url: string | null;
    created_at: string;
}

export interface HistoryListItem {
    id: string;
    topic: string;
    format: string;
    language: string;
    time_estimate: string;
    created_at: string;
    audio_url: string | null;
}

/**
 * Lấy danh sách lịch sử (chỉ metadata, không load full content)
 */
export async function getHistory(): Promise<HistoryListItem[]> {
    const { data, error } = await supabase
        .from('generated_contents')
        .select('id, topic, format, language, time_estimate, created_at, audio_url')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching history:', error);
        throw new Error('Không thể tải lịch sử.');
    }

    return data || [];
}

/**
 * Lấy chi tiết 1 bài theo ID (bao gồm full content)
 */
export async function getContentById(id: string): Promise<HistoryItem | null> {
    const { data, error } = await supabase
        .from('generated_contents')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching content:', error);
        throw new Error('Không thể tải nội dung.');
    }

    return data;
}

/**
 * Lưu nội dung mới vào DB
 */
export async function saveContent(params: {
    userId: string;
    topic: string;
    format: string;
    language: string;
    timeEstimate: string;
    content: string;
    audioUrl?: string | null;
}): Promise<HistoryItem> {
    const { data, error } = await supabase
        .from('generated_contents')
        .insert({
            user_id: params.userId,
            topic: params.topic,
            format: params.format,
            language: params.language,
            time_estimate: params.timeEstimate,
            content: params.content,
            audio_url: params.audioUrl || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving content:', error);
        throw new Error('Không thể lưu nội dung.');
    }

    return data;
}

/**
 * Cập nhật audio URL cho bài đã tồn tại
 */
export async function updateAudioUrl(contentId: string, audioUrl: string): Promise<void> {
    const { error } = await supabase
        .from('generated_contents')
        .update({ audio_url: audioUrl })
        .eq('id', contentId);

    if (error) {
        console.error('Error updating audio URL:', error);
        throw new Error('Không thể cập nhật audio.');
    }
}

/**
 * Upload audio WAV lên Supabase Storage
 * Trả về public URL
 */
export async function uploadAudio(userId: string, audioBase64DataUrl: string): Promise<string> {
    // Chuyển data:audio/wav;base64,... thành Blob
    const base64Data = audioBase64DataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });

    const fileName = `${userId}/${Date.now()}.wav`;

    const { error } = await supabase.storage
        .from('audio-files')
        .upload(fileName, blob, {
            contentType: 'audio/wav',
            upsert: false,
        });

    if (error) {
        console.error('Error uploading audio:', error);
        throw new Error('Không thể upload audio.');
    }

    const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Xóa bài viết và audio kèm theo
 */
export async function deleteContent(id: string): Promise<void> {
    // Lấy audio_url trước khi xóa
    const { data: content } = await supabase
        .from('generated_contents')
        .select('audio_url')
        .eq('id', id)
        .single();

    // Xóa audio từ Storage nếu có
    if (content?.audio_url) {
        try {
            const url = new URL(content.audio_url);
            const pathParts = url.pathname.split('/storage/v1/object/public/audio-files/');
            if (pathParts[1]) {
                await supabase.storage.from('audio-files').remove([pathParts[1]]);
            }
        } catch (e) {
            console.warn('Could not delete audio file:', e);
        }
    }

    // Xóa record
    const { error } = await supabase
        .from('generated_contents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting content:', error);
        throw new Error('Không thể xóa nội dung.');
    }
}
